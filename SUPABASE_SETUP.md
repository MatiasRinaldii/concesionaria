# 📋 Guía de Configuración de Supabase

## ✅ Lo que ya está hecho

He completado el **Setup Inicial** de Supabase:

1. ✅ Instaladas dependencias (`@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`)
2. ✅ Creado cliente de Supabase (`src/lib/supabase.js`)
3. ✅ Creado schema SQL completo (`supabase-schema.sql`)
4. ✅ Creadas funciones API para Clients y Vehicles
5. ✅ Creados hooks personalizados (`useClients`, `useVehicles`)
6. ✅ Template de variables de entorno (`.env.local.example`)

## 🚀 Próximos Pasos

### 1. Crear Proyecto en Supabase (5 minutos)

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Click en "New Project"
3. Rellena:
   - **Name**: `dealership-crm` (o el nombre que prefieras)
   - **Database Password**: (guarda esta contraseña en un lugar seguro)
   - **Region**: Elige la más cercana a ti
4. Click en "Create new project"
5. Espera 1-2 minutos mientras se aprovisionan los recursos

### 2. Configurar Variables de Entorno (2 minutos)

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia los valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key
3. Crea el archivo `.env.local` en la raíz del proyecto:
   ```bash
   cp .env.local.example .env.local
   ```
4. Edita `.env.local` y pega tus valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu-key-aqui
   ```

### 3. Ejecutar el Schema SQL (3 minutos)

1. En Supabase, ve a **SQL Editor** (icono de base de datos en el sidebar)
2. Click en "New query"
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia TODO el contenido y pégalo en el editor SQL de Supabase
5. Click en "Run" (botón verde)
6. Verifica que dice "Success" y no hay errores

### 4. Verificar las Tablas (1 minuto)

1. Ve a **Table Editor** en Supabase
2. Deberías ver 8 tablas:
   - ✅ users
   - ✅ clients
   - ✅ vehicles
   - ✅ leads
   - ✅ conversations
   - ✅ messages
   - ✅ events
   - ✅ settings
3. Click en `clients` y `vehicles` - deberías ver datos de ejemplo (seed data)

### 5. Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Reinicia para que cargue las nuevas variables de entorno
npm run dev
```

## 🎯 ¿Qué sigue después?

Una vez completados estos pasos, te mostraré cómo:
1. Migrar el componente Dashboard para usar los datos de Supabase
2. Conectar el componente Stock con la base de datos
3. Implementar el resto de componentes

## ⚠️ Importante

- **NO** compartas tu archivo `.env.local` ni lo subas a Git
- Ya está añadido a `.gitignore` por seguridad
- La `anon key` es pública, pero la `service_role key` (que no usamos) debe mantenerse secreta

## 📝 Archivos Creados

```
/Users/matiasrinaldi/Documents/concesionaria/
├── .env.local.example          # Template de variables
├── supabase-schema.sql         # Schema completo de la DB
├── src/
│   ├── lib/
│   │   ├── supabase.js         # Cliente de Supabase
│   │   └── api/
│   │       ├── clients.js      # CRUD de clientes
│   │       └── vehicles.js     # CRUD de vehículos
│   └── hooks/
│       ├── useClients.js       # Hook para clientes
│       └── useVehicles.js      # Hook para vehículos
```

## 💡 Ayuda

Si tienes algún problema durante la configuración, avísame y te ayudo a resolverlo.
