import { useEffect, useState } from "react";
import { supabase } from "../../lib/config.js";

// Darbuotojo mėgstamos įmonės (lentelė worker_favorite_companies, tik savo eilutės).
export function useFavoriteCompanies(userId) {
  const [ids, setIds] = useState([]);
  const [companies, setCompanies] = useState({});
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    supabase.from("worker_favorite_companies").select("company_id, created_at").order("created_at", { ascending: false }).then(async ({ data, error }) => {
      if (cancelled || error) return;
      const list = (data || []).map((row) => row.company_id);
      setIds(list);
      if (list.length) {
        const result = await supabase.from("companies").select("id, name, avatar_path").in("id", list);
        if (!cancelled && !result.error) setCompanies(Object.fromEntries((result.data || []).map((row) => [row.id, row])));
      }
    });
    return () => { cancelled = true; };
  }, [userId]);
  const toggle = async (companyId, companyInfo) => {
    if (!companyId) return;
    if (ids.includes(companyId)) {
      setIds((current) => current.filter((id) => id !== companyId));
      await supabase.from("worker_favorite_companies").delete().eq("company_id", companyId).eq("worker_id", userId);
    } else {
      setIds((current) => [companyId, ...current]);
      if (companyInfo) setCompanies((current) => ({ ...current, [companyId]: { id: companyId, ...companyInfo } }));
      await supabase.from("worker_favorite_companies").insert({ worker_id: userId, company_id: companyId });
    }
  };
  return { favoriteIds: ids, favoriteCompanies: companies, toggleFavorite: toggle, isFavorite: (companyId) => ids.includes(companyId) };
}
