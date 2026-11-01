(function(){const t=new Date().toISOString().slice(0,10);const d=new Date();d.setDate(d.getDate()+1);const tm=d.toISOString().slice(0,10);
window.__DATA={
 "rpc:job_ads_company_list":(()=>{const iso=(d)=>new Date(Date.now()+d*864e5).toISOString();return [
  {id:"ea1",title:"Statybų darbininkas",city:"Vilnius",salary_min:1600,salary_max:1900,salary_gross:false,status:"active",live:true,expires_at:iso(24),candidates:4,new_candidates:2,views:63,saves:5,interviews:1},
  {id:"ea2",title:"Plytelių klojėjas",city:"Kaunas",salary_min:2200,salary_max:null,salary_gross:true,status:"pending_payment",live:false,expires_at:null,candidates:0,new_candidates:0,views:0,saves:0,payment_pending:true}];})(),
 "rpc:job_ad_company_detail":(()=>{const iso=(d)=>new Date(Date.now()+d*864e5).toISOString();return {id:"ea1",title:"Statybų darbininkas",city:"Vilnius",address:"Ozo g. 25, Vilnius",contract_type:"Neterminuota darbo sutartis",schedule:"I–V · 08:00–17:00",salary_min:1600,salary_max:1900,salary_gross:false,status:"active",live:true,expires_at:iso(24),views:63,
  candidates:[{id:"c1",worker_id:"w1",name:"Tomas Kazlauskas",city:"Vilnius",attendance_rate:100,status:"sent",message:"Galiu pradėti nuo pirmadienio.",created_at:iso(-1),documents:["Darbas aukštyje"]},
   {id:"c2",worker_id:"w2",name:"Rokas Petrauskas",city:"Vilnius",attendance_rate:96,status:"viewed",created_at:iso(-3),cv_requested_at:iso(-1),documents:[]},
   {id:"c3",worker_id:"w3",name:"Beata Bune",city:"Vilnius",attendance_rate:100,status:"interview",created_at:iso(-4),interview_at:iso(2),interview_how:"live",interview_address:"Ozo g. 25, Vilnius",interview_confirmed_at:iso(-0.2),documents:["Saugos ir sveikatos instruktažas"],cv_path:"x/cv.pdf"}],
  savers:[{worker_id:"w4",name:"Mantas Jonaitis",city:"Kaunas",nudged:false},{worker_id:"w5",name:"Aistė Valė",city:"Vilnius",nudged:true}]};})(),
 company_members:[{company_id:"c1",member_role:"owner",user_id:"00000000-0000-0000-0000-000000000001"}],
 companies:[{id:"c1",name:"UAB Pavyzdinė statyba",reliability_rate:97,cancelled_confirmed_count:1,avatar_path:""}],
 jobs:[{id:"j1",title:"Betonavimo pagalba",city:"Vilnius",address_text:"Linkmenų g. 34, Vilnius",work_date:t,start_time:"08:00:00",end_time:"17:00:00",workers_needed:2,status:"open",company_id:"c1",created_by:"00000000-0000-0000-0000-000000000001",pay_amount:130,pay_unit:"day"},
       {id:"j2",title:"Pagalbiniai mūro darbai",city:"Vilnius",address_text:"Kalvarijų g. 120, Vilnius",work_date:tm,start_time:"07:30:00",end_time:"16:30:00",workers_needed:3,status:"open",company_id:"c1",created_by:"00000000-0000-0000-0000-000000000001",pay_amount:15,pay_unit:"hour"}],
 "rpc:get_company_plan_summary":[{plan_key:"business_pro",plan_name:"Business Pro",can_advanced_analytics:true,can_team_chat:true,can_saved_workers:true,can_team_management:true}]
};})();
