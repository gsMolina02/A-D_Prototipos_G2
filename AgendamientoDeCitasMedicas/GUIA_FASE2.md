# 📋 GUÍA PARA COMPLETAR FASE 2 - CORRECCIONES Y RE-ANÁLISIS

## 🎯 Estado Actual (Fase 1)
✅ **Análisis completado** - 6 de diciembre de 2025

### Métricas Obtenidas:
- ✅ Cobertura de tests: **15.46%** (Meta: >80%)
- ✅ Tests exitosos: **16.67%** (2/12 pasados)
- ✅ ESLint errores: **3,972 errores**
- ✅ Vulnerabilidades: **5 total** (0 critical, 3 high, 2 moderate)
- ✅ ICP (Cumplimiento): **36.54%**
- ✅ No Conformidades: **3,982**
- ⚠️ TPR (Rendimiento): **Pendiente JMeter**
- ⚠️ CC (Complejidad): **Pendiente SonarQube**
- ⚠️ IVC: **Pendiente cálculo final**

---

## 🔧 PASOS PENDIENTES PARA FASE 2

### 1️⃣ CORREGIR ERRORES DE CONEXIÓN A BASE DE DATOS

**Problema:** Tests fallando con error "Tenant or user not found"

**Acciones:**
```bash
# 1. Verificar archivo .env
cd Backend
cat .env  # o notepad .env

# 2. Asegurar que DATABASE_URL está correctamente configurada
# Formato: postgresql://user:password@host:port/database

# 3. Verificar credenciales de Supabase
# - Ir a dashboard de Supabase
# - Copiar Connection String actualizada
# - Actualizar .env
```

**Archivos a revisar:**
- `Backend/.env` - Configuración de conexión
- `Backend/src/db/db.js` - Cliente PostgreSQL
- `Backend/test_connection.js` - Test de conexión

---

### 2️⃣ CORREGIR ERRORES DE ESLINT

**Total errores:** 3,972

**Acciones:**
```powershell
# Navegar al Backend
cd AgendamientoDeCitasMedicas\Backend

# 1. Aplicar correcciones automáticas
npm run lint -- --fix

# 2. Revisar errores restantes
npm run lint

# 3. Generar nuevo reporte
npm run lint:json
```

**Tipos de errores comunes a corregir:**
- Variables no utilizadas
- Imports no usados
- Problemas de sintaxis
- Reglas de seguridad
- Formato de código

---

### 3️⃣ AUMENTAR COBERTURA DE TESTS

**Cobertura actual:** 15.46% → **Meta:** >80%

**Acciones:**
```powershell
# 1. Crear tests para funciones sin cobertura
cd Backend

# 2. Identificar archivos sin tests
npm run test:coverage

# 3. Ver reporte detallado en navegador
# Abrir: Backend/coverage/lcov-report/index.html

# 4. Añadir tests para:
# - Controllers (actualmente 0% cobertura)
# - Models (actualmente 0% cobertura)
# - Routes (actualmente 20% cobertura)
# - Services (actualmente 0% cobertura)
```

**Archivos prioritarios para añadir tests:**
- `src/controllers/citaController.js`
- `src/controllers/userController.js`
- `src/controllers/horarioController.js`
- `src/services/emailService.js`
- `src/services/whatsappService.js`

---

### 4️⃣ ACTUALIZAR DEPENDENCIAS VULNERABLES

**Vulnerabilidades:** 3 HIGH, 2 MODERATE

**Acciones:**
```powershell
cd Backend

# 1. Ver detalle de vulnerabilidades
npm audit

# 2. Aplicar correcciones automáticas
npm audit fix

# 3. Si hay breaking changes, revisar manualmente:
npm audit fix --force

# 4. Verificar que todo funciona después de actualizar
npm test
npm start

# 5. Generar nuevo reporte
npm audit --json > reports/audit-report.json
```

---

### 5️⃣ EJECUTAR ANÁLISIS CON SONARQUBE

**Propósito:** Obtener métricas de complejidad ciclomática (CC)

**Instalación:**
```powershell
# Opción 1: Docker (recomendado)
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Opción 2: SonarCloud (online)
# Ir a https://sonarcloud.io
# Conectar con GitHub
# Importar repositorio
```

**Configuración:**
```powershell
# 1. Crear archivo sonar-project.properties
cd Backend
New-Item sonar-project.properties

# Contenido:
sonar.projectKey=agendamiento-citas-medicas
sonar.projectName=Sistema Agendamiento Citas
sonar.sources=src
sonar.tests=src/tests
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

**Ejecución:**
```powershell
# Instalar SonarScanner
npm install -g sonarqube-scanner

# Ejecutar análisis
sonar-scanner

# Ver resultados en:
# http://localhost:9000
```

**Métricas a extraer:**
- Complejidad Ciclomática (CC)
- Code Smells
- Technical Debt
- Duplicación de código

---

### 6️⃣ EJECUTAR PRUEBAS DE RENDIMIENTO CON JMETER

**Propósito:** Obtener TPR (Tiempo Promedio de Respuesta)

**Instalación:**
```powershell
# Descargar JMeter
# https://jmeter.apache.org/download_jmeter.cgi

# Extraer en C:\Apache-JMeter
# Añadir al PATH:
$env:PATH += ";C:\Apache-JMeter\bin"
```

**Crear Plan de Pruebas:**
```
1. Abrir JMeter GUI
2. Crear Thread Group:
   - Usuarios: 50
   - Ramp-up: 10s
   - Loops: 5

3. Añadir HTTP Request Sampler:
   - Server: localhost
   - Port: 3000
   - Path: /api/citas

4. Añadir Listeners:
   - View Results Tree
   - Summary Report
   - Aggregate Report

5. Ejecutar y guardar resultados
```

**Endpoints a probar:**
- GET `/api/citas` - Listar citas
- POST `/api/citas` - Crear cita
- GET `/api/citas/paciente/:id` - Citas por paciente
- PUT `/api/citas/:id/cancelar` - Cancelar cita
- POST `/api/login` - Autenticación

**Métricas a extraer:**
- Tiempo promedio de respuesta (ms)
- Throughput (req/s)
- Error rate (%)
- 95th percentile response time

---

### 7️⃣ REGENERAR MÉTRICAS FASE 2

**Después de aplicar todas las correcciones:**

```powershell
cd Backend

# 1. Generar métricas de código
node generate_metrics.js

# 2. Ejecutar tests con cobertura
npm run test:coverage

# 3. Auditoría de vulnerabilidades
npm audit --json > reports/audit-report.json

# 4. Análisis ESLint
npm run lint:json

# 5. Consolidar métricas
node consolidar_metricas.js
```

---

### 8️⃣ ACTUALIZAR DOCUMENTO WORD

**Acción final:**

1. Abrir `Tablas_Metricas_Fase1.docx`

2. Llenar columna **"Valor Fase 2"** con nuevos valores

3. Calcular **Δ (Delta)** = Fase 2 - Fase 1

4. Calcular **% Mejora** = ((Fase 2 - Fase 1) / Fase 1) × 100

5. Actualizar tabla de "Acciones Correctivas" con:
   - ✅ Para acciones completadas
   - ⏳ Para acciones en progreso
   - ❌ Para acciones pendientes

6. Actualizar "Resumen Ejecutivo" con nuevas conclusiones

---

## 📊 TABLA DE SEGUIMIENTO

| Tarea | Estimado | Estado | Responsable | Notas |
|-------|----------|--------|-------------|-------|
| Corregir conexión BD | 2h | ⏳ Pendiente | - | Error "Tenant or user not found" |
| Corregir errores ESLint | 8h | ⏳ Pendiente | - | 3,972 errores |
| Aumentar cobertura tests | 16h | ⏳ Pendiente | - | De 15.46% a >80% |
| Actualizar dependencias | 2h | ⏳ Pendiente | - | 5 vulnerabilidades |
| Configurar SonarQube | 4h | ⏳ Pendiente | - | Análisis CC |
| Ejecutar JMeter | 4h | ⏳ Pendiente | - | Métricas TPR |
| Regenerar métricas | 1h | ⏳ Pendiente | - | Fase 2 |
| Actualizar documento | 2h | ⏳ Pendiente | - | Tablas comparativas |
| **TOTAL** | **39h** | - | - | - |

---

## 🎯 CRITERIOS DE ÉXITO FASE 2

| Métrica | Fase 1 | Meta Fase 2 | Estado |
|---------|---------|-------------|--------|
| Tests exitosos | 16.67% | >90% | ⏳ |
| Cobertura código | 15.46% | >80% | ⏳ |
| Errores ESLint | 3,972 | <50 | ⏳ |
| ICP | 36.54% | >90% | ⏳ |
| Vulnerabilidades HIGH | 3 | 0 | ⏳ |
| NC (No Conformidades) | 3,982 | <10 | ⏳ |
| TPR | Pendiente | <200ms | ⏳ |
| CC promedio | Pendiente | <10 | ⏳ |

---

## 📞 RECURSOS Y AYUDA

**Documentación:**
- Jest: https://jestjs.io/docs/getting-started
- ESLint: https://eslint.org/docs/latest/
- SonarQube: https://docs.sonarqube.org/latest/
- JMeter: https://jmeter.apache.org/usermanual/

**Comandos útiles:**
```powershell
# Ver estado de git
git status

# Crear rama para correcciones
git checkout -b fase2-correcciones

# Commit de cambios
git add .
git commit -m "feat: Correcciones Fase 2 - [descripción]"

# Ver logs de tests
npm test 2>&1 | Tee-Object -FilePath test-output.log
```

---

**Última actualización:** 6 de diciembre de 2025
**Documento:** Guía de Correcciones Fase 2
**Proyecto:** Sistema de Agendamiento de Citas Médicas
