# Edge Functions - Guía de Despliegue

## Edge Functions Actuales en el Proyecto

### ✅ Edge Functions Existentes (Ya Desplegadas)

1. **create-attribution** - Crea atribuciones de Scout
2. **create-project** - Crea proyectos en el smart contract
3. **create-scout-connection** - Crea conexiones Scout-Talent
4. **get-auth-jwt** - Obtiene JWT de autenticación
5. **sync-on-chain-contract** - Sincroniza contratos on-chain con la base de datos
6. **toggle-follow** - Maneja seguir/dejar de seguir usuarios
7. **update-profile** - Actualiza perfiles de usuario
8. **upsert-post** - Crea/actualiza posts (portfolio/gigs)
9. **upsert-service** - Crea/actualiza servicios

### 🆕 Edge Functions NUEVAS (Para Proposal & Acceptance Flow)

10. **accept-project** - Valida y permite aceptar propuestas de proyecto
11. **decline-project** - Valida y permite rechazar propuestas de proyecto

---

## Comandos de Despliegue

### Opción 1: Desplegar SOLO las Nuevas Edge Functions

```bash
# Desplegar accept-project
supabase functions deploy accept-project

# Desplegar decline-project
supabase functions deploy decline-project
```

### Opción 2: Desplegar TODAS las Edge Functions

```bash
# Desplegar todas las funciones de una vez
supabase functions deploy accept-project
supabase functions deploy create-attribution
supabase functions deploy create-project
supabase functions deploy create-scout-connection
supabase functions deploy decline-project
supabase functions deploy get-auth-jwt
supabase functions deploy sync-on-chain-contract
supabase functions deploy toggle-follow
supabase functions deploy update-profile
supabase functions deploy upsert-post
supabase functions deploy upsert-service
```

### Opción 3: Script de Despliegue Completo

Crea un archivo `deploy-functions.sh`:

```bash
#!/bin/bash

echo "🚀 Desplegando Edge Functions..."

functions=(
  "accept-project"
  "create-attribution"
  "create-project"
  "create-scout-connection"
  "decline-project"
  "get-auth-jwt"
  "sync-on-chain-contract"
  "toggle-follow"
  "update-profile"
  "upsert-post"
  "upsert-service"
)

for func in "${functions[@]}"
do
  echo "📦 Desplegando $func..."
  supabase functions deploy "$func"
  if [ $? -eq 0 ]; then
    echo "✅ $func desplegado exitosamente"
  else
    echo "❌ Error desplegando $func"
  fi
  echo ""
done

echo "🎉 Despliegue completado!"
```

Luego ejecuta:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

---

## Verificación Post-Despliegue

### 1. Verificar que las funciones están activas

```bash
supabase functions list
```

### 2. Ver logs de una función específica

```bash
# Ver logs de accept-project
supabase functions logs accept-project

# Ver logs de decline-project
supabase functions logs decline-project
```

### 3. Probar las nuevas funciones

#### Test accept-project:
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/accept-project' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": 1,
    "talentId": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  }'
```

#### Test decline-project:
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/decline-project' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": 1,
    "talentId": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  }'
```

---

## Variables de Entorno Requeridas

Asegúrate de que estas variables estén configuradas en Supabase:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Para configurarlas:
```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Troubleshooting

### Error: "Function not found"
- Verifica que el archivo `index.ts` existe en la carpeta de la función
- Asegúrate de estar en el directorio raíz del proyecto

### Error: "Permission denied"
- Verifica que estás autenticado: `supabase login`
- Verifica que tienes permisos en el proyecto

### Error: "Invalid function"
- Verifica la sintaxis del archivo `index.ts`
- Revisa los logs: `supabase functions logs function-name`

### Error de CORS
- Las funciones ya incluyen headers CORS
- Si persiste, verifica la configuración en Supabase Dashboard

---

## Resumen de Archivos Creados

### Nuevas Edge Functions:
- ✅ `supabase/functions/accept-project/index.ts`
- ✅ `supabase/functions/decline-project/index.ts`

### Funcionalidad:
- **accept-project**: Valida que el proyecto existe, está en estado Pending_Acceptance (4), y el caller es el talent asignado
- **decline-project**: Valida que el proyecto existe, está en estado Pending_Acceptance (4), y el caller es el talent asignado

### Flujo:
1. Frontend llama a la Edge Function para validación
2. Edge Function verifica en la base de datos
3. Si es válido, retorna datos del proyecto
4. Frontend procede con la llamada al smart contract
5. Smart contract ejecuta accept-project o decline-project
6. sync-on-chain-contract actualiza la base de datos

---

## Próximos Pasos

1. ✅ Desplegar las nuevas Edge Functions
2. ✅ Desplegar la migración de base de datos
3. ✅ Probar el flujo completo end-to-end
4. ✅ Monitorear logs para errores
5. ✅ Verificar que las propuestas se muestran correctamente

---

## Comando Rápido (Recomendado)

Para desplegar solo las funciones nuevas necesarias para el Proposal & Acceptance Flow:

```bash
supabase functions deploy accept-project && supabase functions deploy decline-project
```

¡Listo! 🎉
