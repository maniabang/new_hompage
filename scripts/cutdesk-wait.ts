import postgres from 'postgres';
const sql=postgres(process.env.DATABASE_URL!,{ssl:'require',prepare:false,max:1});
try{let ready=false;for(let i=0;i<90;i++){const [r]=await sql`select count(*)::int n from cutdesk.cuts`;if(r.n>=393){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,5000));}if(!ready)throw new Error('Initial import has not committed yet.');console.log('Initial source import committed.');}finally{await sql.end();}
