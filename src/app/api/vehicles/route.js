import { NextResponse } from 'next/server';
import { query, insert, update, remove } from '@/lib/db';

// GET /api/vehicles - Get all vehicles
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const make = searchParams.get('make');

        let sql = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];

        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }

        if (make) {
            params.push(make);
            sql += ` AND make = $${params.length}`;
        }

        sql += ' ORDER BY created_at DESC';

        const vehicles = await query(sql, params);
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error('Get vehicles error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/vehicles - Create vehicle
export async function POST(request) {
    try {
        const data = await request.json();
        const vehicle = await insert('vehicles', {
            make: data.make,
            model: data.model,
            year: data.year,
            price: data.price,
            mileage: data.mileage || null,
            color: data.color || null,
            status: data.status || 'available',
            description: data.description || null,
            images: data.images ? JSON.stringify(data.images) : '[]'
        });
        return NextResponse.json(vehicle, { status: 201 });
    } catch (error) {
        console.error('Create vehicle error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/vehicles - Update vehicle
export async function PATCH(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data = await request.json();
        if (data.images) {
            data.images = JSON.stringify(data.images);
        }
        const vehicle = await update('vehicles', id, data);
        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Update vehicle error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/vehicles - Delete vehicle
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        await remove('vehicles', id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
