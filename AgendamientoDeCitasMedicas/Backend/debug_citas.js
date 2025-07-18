const { query } = require('./src/db/db');

async function checkCitasTable() {
    try {
        console.log('Verificando estructura de la tabla citas...\n');
        
        // Ver estructura de la tabla
        const structure = await query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'citas'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estructura de la tabla citas:');
        structure.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
        });
        
        // Ver datos existentes
        console.log('\n📊 Datos existentes en la tabla citas:');
        const data = await query('SELECT * FROM citas LIMIT 5');
        console.table(data.rows);
        
        // Verificar el valor problemático
        console.log('\n🔍 Analizando el valor "Consulta General":');
        console.log(`Longitud: ${('Consulta General').length} caracteres`);
        console.log(`Valor: "${('Consulta General')}"`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkCitasTable();
