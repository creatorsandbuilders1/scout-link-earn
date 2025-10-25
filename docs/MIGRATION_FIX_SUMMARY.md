# 🔧 MIGRATION FIX: Contract ID Reference

## ❌ EL PROBLEMA

La migración `20251025000002_refactor_messaging_to_contracts.sql` tenía un error:

```sql
-- ❌ INCORRECTO
REFERENCES on_chain_contracts(id)
```

**Error:** `column "id" referenced in foreign key constraint does not exist`

## ✅ LA SOLUCIÓN

La tabla `on_chain_contracts` usa `project_id` como PRIMARY KEY, no `id`.

```sql
-- ✅ CORRECTO
REFERENCES on_chain_contracts(project_id)
```

---

## 📋 CAMBIOS REALIZADOS

### 1. Foreign Key en `messages` table
```sql
-- ANTES (❌)
ALTER TABLE messages 
  ADD CONSTRAINT messages_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(id) 
  ON DELETE CASCADE;

-- DESPUÉS (✅)
ALTER TABLE messages 
  ADD CONSTRAINT messages_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(project_id) 
  ON DELETE CASCADE;
```

### 2. Foreign Key en `notifications` table
```sql
-- ANTES (❌)
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(id) 
  ON DELETE CASCADE;

-- DESPUÉS (✅)
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_contract_id_fkey 
  FOREIGN KEY (contract_id) 
  REFERENCES on_chain_contracts(project_id) 
  ON DELETE CASCADE;
```

### 3. RLS Policies
```sql
-- ANTES (❌)
WHERE on_chain_contracts.id = messages.contract_id

-- DESPUÉS (✅)
WHERE on_chain_contracts.project_id = messages.contract_id
```

### 4. Helper Function
```sql
-- ANTES (❌)
INNER JOIN on_chain_contracts c ON m.contract_id = c.id

-- DESPUÉS (✅)
INNER JOIN on_chain_contracts c ON m.contract_id = c.project_id
```

### 5. Edge Function
```sql
-- ANTES (❌)
.select('id, client_id, talent_id, title')
.eq('id', contractId)

-- DESPUÉS (✅)
.select('project_id, client_id, talent_id, project_title')
.eq('project_id', contractId)
```

---

## 📊 SCHEMA DE on_chain_contracts

```sql
CREATE TABLE public.on_chain_contracts (
  -- On-chain project ID (PRIMARY KEY)
  project_id INTEGER PRIMARY KEY,  -- ← Este es el PK, no "id"
  
  -- Contract participants
  client_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  scout_id TEXT NOT NULL,
  
  -- Financial details
  amount_micro_stx BIGINT NOT NULL,
  scout_fee_percent INTEGER NOT NULL,
  platform_fee_percent INTEGER NOT NULL,
  
  -- Contract status
  status INTEGER NOT NULL,
  
  -- Project details
  project_title TEXT,
  project_brief TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  funded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Nota:** La columna se llama `project_title`, no `title`.

---

## ✅ ARCHIVOS CORREGIDOS

1. `supabase/migrations/20251025000002_refactor_messaging_to_contracts.sql`
2. `supabase/functions/send-message/index.ts`

---

## 🚀 DEPLOYMENT

Ahora la migración debería ejecutarse correctamente:

```bash
# En Supabase SQL Editor, ejecutar:
supabase/migrations/20251025000002_refactor_messaging_to_contracts.sql
```

---

## 🧪 VERIFICACIÓN

Después de ejecutar la migración, verificar:

```sql
-- Verificar foreign keys
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('messages', 'notifications');
```

Debería mostrar:
- `messages.contract_id` → `on_chain_contracts.project_id`
- `notifications.contract_id` → `on_chain_contracts.project_id`

---

**Status:** ✅ CORREGIDO  
**Ready for deployment:** ✅ SÍ
