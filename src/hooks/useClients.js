import { useState, useEffect, useCallback } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../lib/api/clients';

export function useClients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getClients();
            setClients(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addClient = useCallback(async (clientData) => {
        try {
            const newClient = await createClient(clientData);
            setClients(prev => [newClient, ...prev]);
            return newClient;
        } catch (err) {
            console.error('Error creating client:', err);
            throw err;
        }
    }, []);

    const editClient = useCallback(async (id, updates) => {
        try {
            const updated = await updateClient(id, updates);
            setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
            return updated;
        } catch (err) {
            console.error('Error updating client:', err);
            throw err;
        }
    }, []);

    const removeClient = useCallback(async (id) => {
        try {
            await deleteClient(id);
            setClients(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting client:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return {
        clients,
        loading,
        error,
        fetchClients,
        refreshClients: fetchClients,
        addClient,
        editClient,
        removeClient
    };
}
