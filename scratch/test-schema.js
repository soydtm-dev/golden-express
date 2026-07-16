const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("No se encontró el archivo .env.local");
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const eqIdx = cleanLine.indexOf('=');
    if (eqIdx > 0) {
      const key = cleanLine.substring(0, eqIdx).trim();
      const val = cleanLine.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log("Conectando a Supabase:", supabaseUrl);
  
  // 1. Intentamos obtener una fila para ver las columnas
  const { data: selectData, error: selectError } = await supabase
    .from('chat_sessions')
    .select('*')
    .limit(1);

  if (selectError) {
    console.error("Error al hacer SELECT *:", selectError);
  } else if (selectData && selectData.length > 0) {
    console.log("Fila encontrada. Columnas:", Object.keys(selectData[0]));
    return;
  } else {
    console.log("No hay filas en chat_sessions. Intentamos forzar un error de columna inválida para obtener el esquema.");
  }

  // 2. Intentamos hacer una consulta con una columna ficticia inválida para ver si PostgREST nos dice qué columnas existen
  const { error: invalidColError } = await supabase
    .from('chat_sessions')
    .select('columna_que_no_existe');

  if (invalidColError) {
    console.log("Mensaje de error al consultar columna inválida:", invalidColError.message);
    console.log("Detalles del error:", invalidColError.details);
    console.log("Sugerencia (hint):", invalidColError.hint);
  }
}

inspectSchema();
