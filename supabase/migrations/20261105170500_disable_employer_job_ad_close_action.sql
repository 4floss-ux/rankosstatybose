-- Old employer close RPC must not be callable after switching to Delete.
revoke execute on function public.job_ad_close(uuid) from authenticated;
