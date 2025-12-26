---
description: Migrar de Supabase a PostgreSQL + Express para producción
---

# Migrar a Producción (PostgreSQL + Express)

Este workflow convierte el frontend de Supabase a usar el servidor Express con PostgreSQL.
Se recomienda migrar **gradualmente por módulos** para minimizar errores.

---

## Pre-requisitos

1. Servidor Express en `server/` funcionando con PostgreSQL
2. Schema SQL ejecutado en PostgreSQL (`sql/schema.sql`)
3. Variables de entorno configuradas en `server/.env`
4. Redis configurado para sesiones y realtime

---

## Fase 0: Verificar rutas Express existentes

Antes de migrar, verificar que estas rutas existan en `server/routes/`:

| Entidad | Endpoint | Métodos |
|---------|----------|---------|
| Auth | `/api/auth` | POST login, register, logout |
| Clients | `/api/clients` | GET, POST, PATCH, DELETE |
| Messages | `/api/messages` | GET, POST |
| Vehicles | `/api/vehicles` | GET, POST, PATCH, DELETE |
| Events | `/api/events` | GET, POST, PATCH, DELETE |
| Event Types | `/api/event-types` | GET, POST, DELETE |
| Car States | `/api/car-states` | GET, POST, DELETE |
| Labels | `/api/labels` | GET, POST, DELETE |
| Teams | `/api/teams` | GET, POST |
| Team Messages | `/api/team-messages` | GET, POST |
| Upload | `/api/upload` | POST (multipart/form-data) |

> [!IMPORTANT]
> Cada ruta faltante debe crearse antes de migrar ese módulo.

---

## Fase 1: Migrar datos de Supabase a PostgreSQL

### Opción A: Exportar desde Supabase

```bash
# En Supabase Dashboard > Settings > Database > Connection string
pg_dump -h <supabase-host> -U postgres -d postgres -F c -f backup.dump
pg_restore -h <postgresql-host> -U postgres -d <database> backup.dump
```

### Opción B: Script manual

Crear script `scripts/migrate-data.js` que:
1. Conecte a Supabase vía API
2. Obtenga todos los datos
3. Inserte en PostgreSQL local

---

## Fase 2: Migrar Auth (crítico, hacer primero)

### 2.1 Actualizar `src/contexts/AuthContext.tsx`

Cambiar de Supabase Auth a JWT:

```javascript
import { api } from '../lib/api';

// Login
const response = await api.post('/auth/login', { email, password });
localStorage.setItem('token', response.token);

// Logout
localStorage.removeItem('token');
await api.post('/auth/logout');

// Get current user from token
const user = decodeJWT(localStorage.getItem('token'));
```

### 2.2 Crear `src/lib/api.js` (HTTP client con JWT)

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers,
        },
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}

export const api = {
    get: (url) => request(url),
    post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
    patch: (url, data) => request(url, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (url) => request(url, { method: 'DELETE' }),
};
```

---

## Fase 3: Migrar módulos gradualmente

Para cada módulo, seguir este proceso:

### 3.1 Cambiar import

```javascript
// ANTES
import { supabase } from '../supabase';

// DESPUÉS
import { api } from '../api';
```

### 3.2 Convertir queries

```javascript
// ANTES (Supabase)
const { data, error } = await supabase.from('clients').select('*');

// DESPUÉS (Express)
const data = await api.get('/clients');
```

### Orden recomendado de migración:

1. **clients.js** - Base para mensajes
2. **messages.js** + **useChats.js** - Chat con clientes
3. **labels.js** - Etiquetas
4. **vehicles.js** - Stock
5. **carStates.js** - Estados de vehículos
6. **events.js** + **eventTypes.js** - Calendario
7. **teamConversations.js** + **useTeamChats.js** - Chat de equipos
8. **storage.js** - Upload de archivos (ver Fase 4)

---

## Fase 4: Migrar Storage

### 4.1 Crear endpoint upload en Express

```javascript
// server/routes/upload.js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    // Subir a R2/S3 o guardar localmente
    const url = `${process.env.STORAGE_URL}/${req.file.filename}`;
    res.json({ url });
});
```

### 4.2 Actualizar `storage.js` frontend

```javascript
export async function uploadFile(file, bucket = 'vehicles') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    
    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
    });
    
    return response.json();
}
```

---

## Fase 5: Migrar Realtime (Socket.io)

### 5.1 Actualizar `useChats.js`

```javascript
// ANTES
useEffect(() => {
    const subscription = supabase.channel('messages').on(...);
    return () => subscription.unsubscribe();
}, []);

// DESPUÉS
import { getSocket, joinClientRoom, onNewMessage } from '../lib/socket';

useEffect(() => {
    const socket = getSocket();
    joinClientRoom(socket, clientId);
    const cleanup = onNewMessage(socket, (message) => {
        setMessages(prev => [...prev, message]);
    });
    return cleanup;
}, [clientId]);
```

### 5.2 Hacer lo mismo con `useTeamChats.js`

---

## Fase 6: Limpiar Supabase

Una vez todo funcione:

```bash
npm uninstall @supabase/supabase-js
rm -rf src/lib/supabase
```

Eliminar variables de entorno de Supabase de `.env.local`.

---

## Fase 7: Verificar

```bash
npm run build
npm run start
```

### Checklist final:
- [ ] Login/Logout funcionan
- [ ] Chat con clientes funciona
- [ ] Chat de equipos funciona
- [ ] Subida de archivos funciona
- [ ] Calendario funciona
- [ ] Stock funciona
- [ ] Labels/Tags funcionan
- [ ] Realtime funciona (mensajes aparecen sin recargar)

---

## Variables de entorno finales

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://tu-api.com/api
NEXT_PUBLIC_WS_URL=wss://tu-api.com
NEXT_PUBLIC_STORAGE_URL=https://storage.tu-api.com

# No más variables de Supabase
```

---

## Comandos

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && npm run dev
```
