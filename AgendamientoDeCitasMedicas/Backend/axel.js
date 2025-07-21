const { query } = require('./src/db/db');

async function fixCitasTable() {
    try {
        console.log('🔧 Corrigiendo estructura de la tabla citas...\n');
        
        // Aumentar el tamaño del campo horario de VARCHAR(10) a VARCHAR(20)
        await query('ALTER TABLE citas ALTER COLUMN horario TYPE VARCHAR(20)');
        console.log('✅ Campo horario expandido a VARCHAR(20)');
        
        // Verificar la nueva estructura
        const structure = await query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'citas' AND column_name = 'horario'
        `);
        
        console.log('📋 Nueva estructura del campo horario:');
        console.table(structure.rows);
        
        console.log('\n🎉 Corrección completada. Ahora se pueden insertar horarios como "09:00 - 09:30"');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixCitasTable();