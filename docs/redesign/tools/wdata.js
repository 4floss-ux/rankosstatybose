(function(){const d=new Date();d.setDate(d.getDate()+1);const t=d.toISOString().slice(0,10);
window.__DATA={
 job_invitations:[{id:"inv1",job_id:"j1",status:"pending",message:"",invited_at:new Date().toISOString(),responded_at:null}],
 jobs:[{id:"j1",title:"Pagalbiniai statybos darbai",city:"Vilnius",address_text:"Ozo g. 25, Vilnius",work_date:t,start_time:"08:00:00",end_time:"17:00:00",break_start_time:"12:00:00",break_end_time:"12:30:00",description:"Pagalbiniai darbai statybvietėje: medžiagų pernešimas, tvarkymas. Reikalinga darbo avalynė.",pay_amount:14,pay_unit:"hour",company_id:"c1",status:"open",transport_mode:"self_arrival"}],
 companies:[{id:"c1",name:"UAB Statybų partneris",avatar_path:"",reliability_rate:98,cancelled_confirmed_count:0}],
 "rpc:get_job_contact":[{company_name:"UAB Statybų partneris",phone:"+370 600 11223"}]
};})();
