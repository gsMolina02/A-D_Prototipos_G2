# 📊 EJEMPLO: Cómo Llenar las Tablas en Fase 2

## Introducción

Este documento muestra **ejemplos prácticos** de cómo calcular y llenar los valores de Fase 2 una vez que hayas completado las correcciones.

---

## 🧮 TABLA DE COBERTURA DE TESTS

### Fase 1 (Actual):
| Tipo | Fase 1 | Meta |
|------|--------|------|
| Statements | 24.40% | >80% |
| Branches | 0.72% | >70% |
| Functions | 12.16% | >75% |
| Lines | 24.57% | >80% |
| **Promedio** | **15.46%** | **>75%** |

### Ejemplo Fase 2 (Después de correcciones):
| Tipo | Fase 1 | Fase 2 | Δ | % Mejora | Meta |
|------|--------|--------|---|----------|------|
| Statements | 24.40% | 82.15% | +57.75 | +236.7% | >80% ✅ |
| Branches | 0.72% | 73.50% | +72.78 | +10108% | >70% ✅ |
| Functions | 12.16% | 78.90% | +66.74 | +548.8% | >75% ✅ |
| Lines | 24.57% | 84.30% | +59.73 | +243.2% | >80% ✅ |
| **Promedio** | **15.46%** | **79.71%** | **+64.25** | **+415.6%** | **>75%** ✅ |

### Cómo Obtener Valores Fase 2:
```powershell
# Después de añadir más tests
cd Backend
npm run test:coverage

# Buscar en la salida:
# ------|---------|----------|---------|---------|-------------------
# File  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
# ------|---------|----------|---------|---------|-------------------
# All files | 82.15  |   73.50  |  78.90  |  84.30  |
```

### Cálculo de Δ y % Mejora:
```
Δ = Valor Fase 2 - Valor Fase 1
% Mejora = ((Valor Fase 2 - Valor Fase 1) / Valor Fase 1) × 100

Ejemplo Statements:
Δ = 82.15 - 24.40 = +57.75
% Mejora = ((82.15 - 24.40) / 24.40) × 100 = +236.7%
```

---

## 🧪 TABLA DE RESULTADOS DE TESTS

### Fase 1 (Actual):
| Métrica | Valor |
|---------|-------|
| Total Tests | 12 |
| Tests Exitosos | 2 |
| Tests Fallidos | 10 |
| Tasa de Éxito | 16.67% |

### Ejemplo Fase 2:
| Métrica | Fase 1 | Fase 2 | Δ | % Mejora |
|---------|--------|--------|---|----------|
| Total Tests | 12 | 45 | +33 | +275% |
| Tests Exitosos | 2 | 43 | +41 | +2050% |
| Tests Fallidos | 10 | 2 | -8 | -80% |
| Tasa de Éxito | 16.67% | 95.56% | +78.89 | +473.3% |

### Cómo Obtener:
```powershell
npm run test:coverage

# Buscar en la salida:
# Test Suites: 2 failed, 43 passed, 45 total
# Tests:       2 failed, 43 passed, 45 total
```

### Cálculo Tasa de Éxito:
```
Tasa de Éxito = (Tests Pasados / Total Tests) × 100
Fase 2: (43 / 45) × 100 = 95.56%
```

---

## 🔒 TABLA DE VULNERABILIDADES

### Fase 1 (Actual):
| Severidad | Cantidad |
|-----------|----------|
| Critical | 0 |
| High | 3 |
| Moderate | 2 |
| Low | 0 |
| **Total** | **5** |

### Ejemplo Fase 2:
| Severidad | Fase 1 | Fase 2 | Δ | Mejora |
|-----------|--------|--------|---|--------|
| Critical | 0 | 0 | 0 | ✅ OK |
| High | 3 | 0 | -3 | ✅ -100% |
| Moderate | 2 | 1 | -1 | ⚠️ -50% |
| Low | 0 | 0 | 0 | ✅ OK |
| **Total** | **5** | **1** | **-4** | ✅ **-80%** |

### Cómo Obtener:
```powershell
# Después de actualizar dependencias
npm audit

# Buscar en la salida:
# found 1 moderate severity vulnerability
```

### Calcular IVC:
```
IVC = ((Critical + High) / Total Dependencias) × 100

# Obtener total de dependencias:
npm list --depth=0 | Select-String "dependencies" | Measure-Object -Line

# Ejemplo con 25 dependencias:
Fase 1: IVC = ((0 + 3) / 25) × 100 = 12.00%
Fase 2: IVC = ((0 + 0) / 25) × 100 = 0.00%
```

---

## 📝 TABLA DE CALIDAD (ESLint)

### Fase 1 (Actual):
| Métrica | Valor |
|---------|-------|
| Errores ESLint | 3,972 |
| Warnings | 158 |
| Total Issues | 4,130 |
| Archivos con errores | 33/52 |

### Ejemplo Fase 2:
| Métrica | Fase 1 | Fase 2 | Δ | % Mejora |
|---------|--------|--------|---|----------|
| Errores ESLint | 3,972 | 12 | -3,960 | -99.7% |
| Warnings | 158 | 8 | -150 | -94.9% |
| Total Issues | 4,130 | 20 | -4,110 | -99.5% |
| Archivos con errores | 33/52 | 2/52 | -31 | -93.9% |

### Cómo Obtener:
```powershell
# Después de corregir errores
npm run lint

# Buscar en la salida:
# ✖ 12 problems (12 errors, 8 warnings)
```

### Calcular ICP (Índice de Cumplimiento de Procesos):
```
ICP = ((Archivos sin errores / Total archivos) × 100)

Fase 1: ((52-33) / 52) × 100 = 36.54%
Fase 2: ((52-2) / 52) × 100 = 96.15%

Δ = 96.15 - 36.54 = +59.61 puntos porcentuales
```

---

## 🎯 TABLA ISO 9001

### Fase 1 (Actual):
| Métrica | Valor | Meta |
|---------|-------|------|
| ICP | 36.54% | >90% |
| NC | 3,982 | <10 |
| Cobertura | 15.46% | >80% |
| IVC | Pendiente | <5% |

### Ejemplo Fase 2:
| Métrica | Fórmula | Fase 1 | Fase 2 | Δ | Meta | Estado |
|---------|---------|--------|--------|---|------|--------|
| **ICP** | (Archivos OK / Total) × 100 | 36.54% | 96.15% | +59.61 | >90% | ✅ |
| **NC** | Errores + Tests Fallidos | 3,982 | 14 | -3,968 | <10 | ⚠️ |
| **Cobertura** | Promedio Jest | 15.46% | 79.71% | +64.25 | >80% | ⚠️ |
| **IVC** | (Critical+High)/Deps × 100 | 12.00% | 0.00% | -12.00 | <5% | ✅ |
| **TPR** | Promedio JMeter | Pendiente | 145 ms | - | <200ms | ✅ |
| **CC** | Promedio SonarQube | Pendiente | 6.8 | - | <10 | ✅ |
| **MTBF** | Tiempo/Fallos | Pendiente | 850 h | - | >720h | ✅ |

---

## 🚀 TABLA DE RENDIMIENTO (JMeter)

### Ejemplo Resultados JMeter:

| Endpoint | Requests | Avg (ms) | Min (ms) | Max (ms) | Error % |
|----------|----------|----------|----------|----------|---------|
| GET /api/citas | 250 | 138 | 95 | 420 | 0.0% |
| POST /api/citas | 100 | 165 | 110 | 550 | 0.0% |
| GET /api/citas/paciente/:id | 150 | 142 | 88 | 380 | 0.0% |
| PUT /api/citas/:id/cancelar | 50 | 155 | 105 | 390 | 0.0% |
| POST /api/login | 200 | 125 | 80 | 320 | 0.0% |
| **PROMEDIO** | **750** | **145** | **95.6** | **412** | **0.0%** |

### Cómo Interpretar:
```
TPR (Tiempo Promedio Respuesta) = 145 ms ✅ (Meta: <200ms)

Cálculo:
TPR = (138 + 165 + 142 + 155 + 125) / 5 = 145 ms
```

---

## 📊 TABLA SONARQUBE

### Ejemplo Resultados SonarQube:

| Métrica | Valor | Umbral | Estado |
|---------|-------|--------|--------|
| CC Promedio | 6.8 | <10 | ✅ OK |
| CC Máxima | 24 | <20 | ⚠️ Revisar |
| Code Smells | 45 | <100 | ✅ OK |
| Technical Debt | 2.5 días | <5 días | ✅ OK |
| Duplicación | 3.2% | <5% | ✅ OK |
| Maintainability Rating | A | A | ✅ OK |
| Reliability Rating | B | A | ⚠️ Mejorar |
| Security Rating | A | A | ✅ OK |

### Dónde Encontrar en SonarQube:
```
1. Abrir http://localhost:9000
2. Ir al proyecto
3. Ver "Overview"
4. Copiar valores de:
   - Complexity (CC)
   - Code Smells
   - Technical Debt
   - Duplications
   - Ratings
```

---

## 📝 RESUMEN: Completar Documento Word

### Paso a Paso:

#### 1. Ejecutar Análisis Fase 2
```powershell
cd Backend

# Tests con cobertura
npm run test:coverage

# Auditoría
npm audit

# ESLint
npm run lint

# Consolidar
node consolidar_metricas.js
```

#### 2. Abrir Documento Word
- Abrir: `Tablas_Metricas_Fase1.docx`

#### 3. Llenar Columna "Fase 2"
- Copiar valores del terminal
- O copiar de `reports/metricas-consolidadas.json`

#### 4. Calcular Δ (Delta)
```
Para cada fila:
Δ = Valor Fase 2 - Valor Fase 1
```

#### 5. Calcular % Mejora
```
Para cada fila:
% Mejora = ((Fase 2 - Fase 1) / Fase 1) × 100

Si Fase 2 es mejor (mayor cobertura, menor errores):
- Resultado positivo = mejora
- Resultado negativo = empeoramiento
```

#### 6. Colorear Celdas
- Verde ✅: Meta alcanzada
- Amarillo ⚠️: Cerca de meta (80-90%)
- Rojo ❌: Lejos de meta (<80%)

#### 7. Actualizar Resumen Ejecutivo
Incluir:
- % de mejora total
- Metas alcanzadas
- Metas pendientes
- Tiempo invertido
- Lecciones aprendidas

---

## 🎯 CHECKLIST FINAL

Antes de considerar Fase 2 completada:

- [ ] Todos los tests pasan (>90%)
- [ ] Cobertura de código >80%
- [ ] Errores ESLint <50
- [ ] ICP >90%
- [ ] Vulnerabilidades HIGH = 0
- [ ] NC <10
- [ ] TPR <200ms (JMeter ejecutado)
- [ ] CC <10 (SonarQube ejecutado)
- [ ] Documento Word actualizado con valores Fase 2
- [ ] Δ y % Mejora calculados
- [ ] Resumen Ejecutivo actualizado
- [ ] Commit y push a repositorio

---

**Fecha:** 6 de diciembre de 2025  
**Documento:** Guía de Llenado Fase 2  
**Proyecto:** Sistema de Agendamiento de Citas Médicas
