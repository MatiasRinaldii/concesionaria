import { z } from 'zod';

// UUID validation
export const uuidSchema = z.string().uuid();

// Pagination
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Auth schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(1, 'Name is required').max(255)
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
});

// Client schemas
export const clientSchema = z.object({
    name: z.string().min(1).max(255),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email().optional().nullable(),
    platform: z.enum(['web', 'whatsapp', 'instagram', 'facebook', 'email', 'phone']).default('web'),
    agent: z.enum(['AI', 'human']).default('AI'),
    status: z.enum(['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost']).default('new'),
    auto_interes: z.string().optional().nullable(),
    auto_entrega: z.string().optional().nullable(),
    label_id: z.string().uuid().optional().nullable()
});

export const clientUpdateSchema = clientSchema.partial();

// Message schemas
export const messageSchema = z.object({
    session_id: z.string().uuid(),
    message: z.string().optional(),
    message_file: z.array(z.object({
        url: z.string().url(),
        type: z.string(),
        name: z.string()
    })).optional().default([]),
    platform: z.enum(['web', 'whatsapp', 'instagram', 'facebook', 'email', 'phone']).default('web')
}).refine(data => data.message || data.message_file.length > 0, {
    message: 'Message or file is required'
});

// Note schemas
export const noteSchema = z.object({
    client_id: z.string().uuid(),
    message: z.string().min(1, 'Note content is required')
});

// Label schemas
export const labelSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#5B8DEF')
});

// Tag schemas
export const tagSchema = z.object({
    name: z.string().min(1).max(100)
});

// Event schemas
export const eventSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional().nullable(),
    date: z.string().datetime(),
    duration: z.number().int().positive().default(30),
    client_id: z.string().uuid().optional().nullable(),
    event_type_id: z.string().uuid().optional().nullable()
});

export const eventTypeSchema = z.object({
    name: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#5B8DEF')
});

// Vehicle schemas
export const vehicleSchema = z.object({
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    year: z.number().int().min(1900).max(2100),
    price: z.number().nonnegative(),
    mileage: z.number().int().nonnegative().optional().nullable(),
    color: z.string().max(50).optional().nullable(),
    status: z.enum(['available', 'reserved', 'sold']).default('available'),
    description: z.string().optional().nullable(),
    images: z.array(z.string().url()).default([])
});

export const vehicleUpdateSchema = vehicleSchema.partial();

// Team schemas
export const teamSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional().nullable()
});

export const teamMemberSchema = z.object({
    user_id: z.string().uuid(),
    role: z.enum(['admin', 'member']).default('member')
});

// Team message schemas
export const teamMessageSchema = z.object({
    team_id: z.string().uuid(),
    message: z.string().optional(),
    message_file: z.array(z.object({
        url: z.string().url(),
        type: z.string(),
        name: z.string()
    })).optional().default([])
}).refine(data => data.message || data.message_file.length > 0, {
    message: 'Message or file is required'
});

// ID param schema
export const idParamSchema = z.object({
    id: z.string().uuid()
});
