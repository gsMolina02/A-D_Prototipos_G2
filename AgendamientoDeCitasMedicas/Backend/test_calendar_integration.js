const axios = require('axios');

const baseURL = 'http://localhost:5000';

// Simular los datos del calendario tal como los maneja el frontend
function simularCalculoFrontend(horario) {
    console.log('🔍 Simulando cálculo frontend para:', horario);
    
    // Extraer datos con compatibilidad backend/frontend
    let horaInicio = horario.hora_inicio || horario.horaInicio;
    let horaFin = horario.hora_fin || horario.horaFin;
    const duracionCita = horario.duracion_cita || horario.duracionCita;
    const intervalo = horario.intervalo;
    
    // Si viene del backend, las horas incluyen segundos (ej: "09:00:00")
    if (horaInicio && horaInicio.includes(':')) {
      horaInicio = horaInicio.substring(0, 5);
    }
    if (horaFin && horaFin.includes(':')) {
      horaFin = horaFin.substring(0, 5);
    }
    
    console.log('📊 Datos procesados:', {
      horaInicio,
      horaFin,
      duracionCita,
      intervalo,
      'typeof duracionCita': typeof duracionCita,
      'typeof intervalo': typeof intervalo
    });
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      console.log('❌ Faltan datos, retornando 0');
      return 0;
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    const duracionTotal = (fin - inicio) / (1000 * 60);
    
    // Convertir a números
    const duracionNum = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    console.log('🧮 Cálculos:', {
      inicio: inicio.toTimeString(),
      fin: fin.toTimeString(),
      duracionTotal,
      duracionNum,
      intervaloNum,
      'isNaN duracionNum': isNaN(duracionNum),
      'isNaN intervaloNum': isNaN(intervaloNum)
    });
    
    if (isNaN(duracionNum) || isNaN(intervaloNum) || duracionNum <= 0) {
      console.log('❌ NaN detectado, retornando 0');
      return 0;
    }
    
    const tiempoPorCita = duracionNum + intervaloNum;
    const resultado = Math.floor(duracionTotal / tiempoPorCita);
    
    console.log('✅ Resultado final:', resultado);
    return resultado;
}

function generarCitasFrontend(horario) {
    console.log('🕐 Generando citas frontend para:', horario);
    
    const citas = [];
    
    // Extraer datos con compatibilidad backend/frontend
    let horaInicio = horario.hora_inicio || horario.horaInicio;
    let horaFin = horario.hora_fin || horario.horaFin;
    const duracionCita = horario.duracion_cita || horario.duracionCita;
    const intervalo = horario.intervalo;
    
    // Si viene del backend, las horas incluyen segundos
    if (horaInicio && horaInicio.includes(':')) {
      horaInicio = horaInicio.substring(0, 5);
    }
    if (horaFin && horaFin.includes(':')) {
      horaFin = horaFin.substring(0, 5);
    }
    
    if (!horaInicio || !horaFin || !duracionCita || intervalo === undefined) {
      return [];
    }
    
    const inicio = new Date(`1970-01-01T${horaInicio}:00`);
    const fin = new Date(`1970-01-01T${horaFin}:00`);
    let actual = new Date(inicio);

    const duracion = typeof duracionCita === 'number' ? duracionCita : parseInt(duracionCita);
    const intervaloNum = typeof intervalo === 'number' ? intervalo : parseInt(intervalo);
    
    if (isNaN(duracion) || isNaN(intervaloNum) || duracion <= 0) {
      return [];
    }

    while (actual < fin) {
      const inicioCita = actual.toTimeString().slice(0, 5);
      actual.setMinutes(actual.getMinutes() + duracion);
      const finCita = actual.toTimeString().slice(0, 5);
      
      if (actual <= fin) {
        const citaStr = `${inicioCita} - ${finCita}`;
        citas.push(citaStr);
      } else {
        break;
      }
      
      actual.setMinutes(actual.getMinutes() + intervaloNum);
    }
    
    return citas;
}

async function testIntegracionCalendario() {
    try {
        console.log('🚀 === PRUEBA DE INTEGRACIÓN DEL CALENDARIO ===\n');

        // 1. Obtener horarios de todos los doctores
        console.log('1. 📋 Obteniendo horarios de todos los doctores...');
        const respuestaHorarios = await axios.get(`${baseURL}/api/horarios/`);
        const horarios = respuestaHorarios.data;
        
        console.log(`✅ Horarios obtenidos: ${horarios.length}`);
        
        if (horarios.length === 0) {
            console.log('❌ No hay horarios configurados');
            return;
        }

        // 2. Procesar cada horario como lo haría el frontend
        console.log('\n2. 🔧 Procesando horarios como en el frontend...\n');
        
        for (const horario of horarios) {
            console.log(`\n📅 === PROCESANDO HORARIO: ${horario.dia} ===`);
            console.log('Datos del backend:', horario);
            
            // Simular cálculo de citas posibles
            const citasPosibles = simularCalculoFrontend(horario);
            console.log(`📊 Citas posibles calculadas: ${citasPosibles}`);
            
            // Generar horarios de citas
            const citasGeneradas = generarCitasFrontend(horario);
            console.log(`📋 Citas generadas: ${citasGeneradas.length}`);
            console.log('Citas:', citasGeneradas);
            
            // Verificar que el cálculo coincida
            if (citasPosibles === citasGeneradas.length) {
                console.log('✅ Cálculo correcto: cantidad coincide');
            } else {
                console.log('❌ Error: cálculo no coincide');
                console.log(`   Calculado: ${citasPosibles}, Generado: ${citasGeneradas.length}`);
            }
        }

        console.log('\n🎉 === PRUEBA COMPLETADA ===');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    }
}

// Ejecutar la prueba
testIntegracionCalendario();
