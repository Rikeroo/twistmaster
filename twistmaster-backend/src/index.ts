import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
const port = 3001;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Check database connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Successfully connected to database');
        done();
    }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Get curvy roads endpoint
app.get('/api/roads', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        osm_id,
        name,
        ST_AsGeoJSON(way)::json AS geometry,
        tags->'width' as width,
        ST_Length(way::geography) / 
        ST_Distance(ST_StartPoint(way)::geography, 
                   ST_EndPoint(way)::geography) AS sinuosity
      FROM planet_osm_line
      WHERE 
        highway IN ('primary', 'secondary', 'tertiary') AND
        (tags->'width' ~ '^[4-9]' OR tags->'width' IS NULL)
      ORDER BY sinuosity DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Routing endpoint
app.get('/api/route', async (req: Request, res: Response) => {
  try {
    const { startLon, startLat, endLon, endLat } = req.query;
    
    if (!startLon || !startLat || !endLon || !endLat) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    const response = await fetch(
      `http://localhost:5000/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson`
    );
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Routing failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});