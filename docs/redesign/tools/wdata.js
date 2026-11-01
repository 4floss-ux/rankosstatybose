(function(){const d=new Date();d.setDate(d.getDate()+1);const t=d.toISOString().slice(0,10);
window.__DATA={
 worker_documents:[{id:"d1",doc_type:"Darbas aukštyje",valid_until:"2027-05-30",file_path:"u/1.pdf",file_name:"aukstis_pazymejimas.pdf",show_to_employers:true},{id:"d2",doc_type:"Saugos ir sveikatos instruktažas",valid_until:(()=>{const x=new Date();x.setDate(x.getDate()+18);return x.toISOString().slice(0,10)})(),file_path:"u/2.jpg",file_name:"instruktazas_2025.jpg",show_to_employers:true}],
 monthly_awards:[{id:"a1",recipient_id:"u",recipient_type:"worker",award_type:"reliability",award_month:(()=>{const x=new Date();x.setDate(1);x.setMonth(x.getMonth()-1);return x.toISOString().slice(0,8)+"01"})(),metric_value:100,metric_count:5}],
 "rpc:get_worker_recent_ratings":[{id:"r1",score:10,comment:"Punktualus, gerai atliko užduotis.",created_at:new Date().toISOString()},{id:"r2",score:9,comment:"Viskas gerai, kviesime dar.",created_at:new Date(Date.now()-864e6).toISOString()}],
 profiles:[{id:"u",role:"worker",first_name:"Beata",last_name:"Bune",display_name:"Beata Bune",city:"Vilnius"}],
 user_private:[{phone:"+37061234567",birth_date:"1994-05-12"}],
 worker_profiles:[{user_id:"u",travel_radius_km:20,has_driving_license_b:true,short_bio:"2 metus dirbau statybų pagalbine darbuotoja.",years_experience:2}],
 job_invitations:[{id:"inv1",job_id:"j1",status:"pending",message:"",invited_at:new Date().toISOString(),responded_at:null}],
 jobs:[{id:"j1",title:"Pagalbiniai statybos darbai",city:"Vilnius",address_text:"Ozo g. 25, Vilnius",work_date:t,start_time:"08:00:00",end_time:"17:00:00",break_start_time:"12:00:00",break_end_time:"12:30:00",description:"Pagalbiniai darbai statybvietėje: medžiagų pernešimas, tvarkymas. Reikalinga darbo avalynė.",pay_amount:14,pay_unit:"hour",company_id:"c1",status:"open",transport_mode:"self_arrival"}],
 companies:[{id:"c1",name:"UAB Statybų partneris",avatar_path:"",reliability_rate:98,cancelled_confirmed_count:0}],
 "rpc:get_job_contact":[{company_name:"UAB Statybų partneris",phone:"+370 600 11223"}]
};})();
