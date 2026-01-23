import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Attempting to connect to:', process.env.DATABASE_URL.replace(/:[^:]+@/, ':****@'));
        await client.connect();
        console.log('Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.message);
        console.error('Stack:', err.stack);
    }
}

testConnection();
