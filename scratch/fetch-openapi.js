const fs = require('fs');
const path = require('path');
const https = require('https');

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
const supabaseKey = env.SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno en .env.local");
  process.exit(1);
}

const url = `${supabaseUrl}/rest/v1/`;

const options = {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
};

https.get(url, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const schema = JSON.parse(body);
      
      console.log("Definiciones del Esquema de Tablas:");
      const definitions = schema.definitions;
      if (!definitions) {
        console.log("No se encontraron definiciones en el OpenAPI spec. Body:", body.substring(0, 500));
        return;
      }

      for (const tableName of Object.keys(definitions)) {
        if (tableName.includes('messages') || tableName.includes('message')) {
          console.log(`\nTabla: ${tableName}`);
          const properties = definitions[tableName].properties;
          if (properties) {
            console.log("Columnas y tipos:");
            for (const [colName, colVal] of Object.entries(properties)) {
              console.log(`  - ${colName}: ${colVal.type} (${colVal.format || 'no format'})`);
            }
          } else {
            console.log("No tiene propiedades.");
          }
        }
      }
    } catch (e) {
      console.error("Error parseando JSON:", e);
      console.log("Raw body:", body.substring(0, 1000));
    }
  });
}).on('error', (e) => {
  console.error("Error en HTTP GET:", e);
});
