# 📖 README_PARA_AGENTES_IA.md - Punto de Entrada

**Proyecto**: Curso NestJS - Spec-Driven Development  
**Creado para**: Agentes IA (Claude, GitHub Copilot, etc.)  
**Última actualización**: 3 mayo 2026

---

## 🎯 ¿POR DÓNDE EMPIEZO?

Eres un agente IA. Tu misión es implementar features en este proyecto NestJS. Aquí está tu guía de supervivencia.

### 5 SEGUNDOS 
```
Necesitas respuesta MUY rápida?
→ Lee: QUICK_REFERENCE.md
```

### 5 MINUTOS
```
¿Primer vez? ¿Cómo configuro?
→ Lee: SETUP.md (sección "Setup Inicial")
```

### 15 MINUTOS
```
¿Qué debo saber para no romper nada?
→ Lee: RULES.md (sección "Rules CRÍTICAS")
→ Lee: QUICK_REFERENCE.md (sección "NEVER")
```

### 30+ MINUTOS
```
¿Quiero entender TODO el proyecto?
→ Lee en orden:
   1. AGENTS.md (estructura + flujo)
   2. RULES.md (reglas completas)
   3. CLAUDE.md (contexto completo)
   4. docs/ (teoría: NestJS, Kafka, RabbitMQ, Testing)
```

---

## 📚 GUÍA DE DOCUMENTACIÓN

### Nivel 1: SUPER RÁPIDO (⚡)

| Archivo | ¿Cuándo? | ¿Qué es? |
|---------|---------|----------|
| **QUICK_REFERENCE.md** | Necesito respuesta en 30s | Tarjeta cheatsheet con lo ESSENCIAL |
| **SETUP.md (Health Check)** | ¿Está todo funcionando? | Verificar que BD, Redis, Kafka están OK |

---

### Nivel 2: REFERENCIA RÁPIDA (⏱️)

| Archivo | ¿Cuándo? | ¿Qué es? |
|---------|---------|----------|
| **RULES.md** | Voy a escribir código | Rules obligatorias (TDD, testing, cache, etc) |
| **AGENTS.md** | ¿Cuál es el flujo? | Estructura de carpetas + comandos + patrones |
| **02-examples/SPEC.md** | ¿Qué debo implementar? | Especificación de requisitos (RF-1, RF-2, etc) |

---

### Nivel 3: PROFUNDO (🧠)

| Archivo | ¿Cuándo? | ¿Qué es? |
|---------|---------|----------|
| **CLAUDE.md** | Quiero entender TODO | Lineamientos completos, agentes, skills, hooks |
| **docs/NestJS_Core.md** | ¿Cómo funciona NestJS? | Inyección de dependencias, módulos, providers |
| **docs/Kafka,...** | ¿Cómo publica eventos? | Kafka & RabbitMQ explicados para novatos |
| **docs/.../Testing.md** | ¿Cómo escribo tests? | Jest, mocks, fixtures, patrones |

---

## 🗺️ MAPA DE DECISIONES

```
¿ERES NUEVO EN EL PROYECTO?
    ↓
    YES: SETUP.md → AGENTS.md → RULES.md
    NO:  Voy directo a codificar
         
¿NECESITO IMPLEMENTAR FEATURE?
    ↓
    → SPEC.md (leer requisito)
    → RULES.md (verificar reglas)
    → Buscar código similar en src/
    → Escribir test (TDD)
    → Codificar
    → npm run test + npm run lint + npm run build
    
¿ALGO ESTÁ ROTO?
    ↓
    → SETUP.md (sección "Problemas Comunes")
    → QUICK_REFERENCE.md (sección "COMMON ERRORS")
    → docker-compose logs -f
    
¿NO ENTIENDO LA REGLA?
    ↓
    → RULES.md (búscar por número)
    → CLAUDE.md (si RULES.md no alcanza)
```

---

## 📊 JERARQUÍA DE DOCUMENTOS

```
ESTE ARCHIVO
    ↓ (punto de entrada)
    
┌─────────────────────────────────────────┐
│  NIVEL 1: SUPER RÁPIDO (⚡)             │
│  - QUICK_REFERENCE.md                   │
│  - SETUP.md (health check + troubleshoot)│
└─────────────────────────────────────────┘
    ↓ (cuando necesitas más)

┌─────────────────────────────────────────┐
│  NIVEL 2: REFERENCIA RÁPIDA (⏱️)       │
│  - RULES.md (rules obligatorias)        │
│  - AGENTS.md (estructura + flujo)       │
│  - SPEC.md (requisitos funcionales)     │
└─────────────────────────────────────────┘
    ↓ (cuando necesitas entender TODO)

┌─────────────────────────────────────────┐
│  NIVEL 3: PROFUNDO (🧠)                 │
│  - CLAUDE.md (lineamientos completos)   │
│  - docs/ (teoría: NestJS, Kafka, etc)   │
│  - Código fuente: src/ + tests/         │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST: "Estoy listo para codificar?"

Si puedes responder SÍ a TODO esto, ¡adelante!

- [ ] Leí QUICK_REFERENCE.md (5 min)
- [ ] Corrí setup: `npm install && docker-compose up -d` (10 min)
- [ ] Verifiqué que tests pasan: `npm run test` (✅ verde)
- [ ] Identifiqué el requisito en SPEC.md (RF-X)
- [ ] Entiendo las RULES CRÍTICAS en RULES.md
- [ ] Sé dónde está el código similar para referenciar
- [ ] Tengo clara la diferencia entre: Controller → Service → Repository

---

## 🎯 MISIÓN TÍPICA (Template)

Eres un agente IA. Tu jefe te dice:

> "Implementa RF-3: RabbitMQ - Enviar Email"

**Tu workflow**:

```bash
# 1. Leer especificación (10 min)
grep -A 20 "RF-3" 02-examples/SPEC.md

# 2. Leer reglas (5 min)
vim RULES.md  # Buscar "Message Pattern" o "Error Handling"

# 3. Buscar código similar (5 min)
find 02-examples/src -name "*email*" -o -name "*consumer*"

# 4. Escribir test fallando (15 min) - TDD!
vim 02-examples/src/consumers/email.consumer.spec.ts

# 5. Implementar (30 min)
vim 02-examples/src/consumers/email.consumer.ts
npm run test  # ¿PASS?

# 6. Integration test (15 min)
npm run test:integration

# 7. Final checks (10 min)
npm run lint && npm run format
npm run build
npm run test:cov  # ¿>= 80%?

# 8. Commit
git commit -m "feat: RF-3 - Send email via RabbitMQ"
```

**Total**: ~2 horas

---

## 🚀 NEXT STEPS

### Paso 1: Verificar Setup (5 min)
```bash
cd d:\Cursos\Curso_nest\02-examples
npm install
docker-compose up -d
npm run test
# Si todo está ✅ verde, continúa
```

### Paso 2: Leer Especificación (15 min)
```bash
# Abre en editor
02-examples/SPEC.md

# Busca tu feature (RF-X)
# Lee:
# - Descripción
# - Entrada
# - Validaciones
# - Salida
# - Eventos
# - Cache
```

### Paso 3: Entender Reglas (10 min)
```bash
# Lee estas secciones de RULES.md
- Rule #1: ESPECIFICACIÓN PRIMERO
- Rule #2: TEST-DRIVEN DEVELOPMENT (TDD)
- Rule #6: VALIDACIÓN EN LÍMITE DEL SISTEMA
```

### Paso 4: Empezar a Codificar (2 horas)
```bash
# Usa el template arriba (Misión Típica)
# Escribe test → Implementa → Valida → Commit
```

---

## 🆘 AYUDA RÁPIDA

| Pregunta | Respuesta |
|----------|----------|
| ¿Por dónde empiezo? | QUICK_REFERENCE.md |
| ¿Cómo configuro? | SETUP.md |
| ¿Cuál es la regla? | RULES.md |
| ¿Cuál es el flujo? | AGENTS.md |
| ¿Qué debo implementar? | 02-examples/SPEC.md |
| ¿Cómo hago test? | docs/Kafka,...,Testing.md |
| ¿Algo está roto? | SETUP.md → troubleshoot |
| ¿Necesito más contexto? | CLAUDE.md |

---

## 📞 Errores Más Comunes (Evita)

```
❌ "Comencé a codificar sin leer SPEC.md"
✅ Leer SPEC.md PRIMERO (10 min bien invertidos)

❌ "Escribí código sin tests"
✅ Escribir test PRIMERO (TDD)

❌ "Mis tests llaman APIs externas"
✅ Mockear TODO externo (solo use real en integration)

❌ "npm run test me da timeout"
✅ Leer error completo → SETUP.md → troubleshoot

❌ "¿Puedo cambiar la entidad directamente?"
❌ NO. Generar migración: npm run typeorm:migration:generate
```

---

## 🎓 FILOSOFÍA DEL PROYECTO

Este proyecto enseña **Spec-Driven Development**:

1. **Especificación PRIMERO** (SPEC.md es ley)
2. **Tests ANTES que código** (TDD)
3. **Aislamiento Total** (mocks, no APIs reales)
4. **Reglas Claras** (RULES.md es obligatorio)
5. **Código Limpio** (ESLint + Prettier + Logger)

Si entiendes eso, ya entiendes el 80% del proyecto.

---

## 🏁 ESTÁS LISTO

**Próximo paso**:

1. Abre: `d:\Cursos\Curso_nest\QUICK_REFERENCE.md`
2. O si es tu primer día: `d:\Cursos\Curso_nest\SETUP.md`
3. O si necesitas implementar: `d:\Cursos\Curso_nest\02-examples\SPEC.md`

**Good luck! 🚀**

---

**Preguntas?** Consulta la tabla de "AYUDA RÁPIDA" arriba  
**Atascado?** Revisa SETUP.md → "Problemas Comunes"  
**Quiero más?** Lee CLAUDE.md para el contexto completo  

**Last updated**: 3 mayo 2026  
**For**: Agentes IA implementando features
