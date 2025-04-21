import express from 'express';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'twistmaster',
  password: 'secret',
  port: 5432,
});

// Endpoint to get curvy roads
app.get('/api/roads', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      osm_id, 
      name, 
      ST_AsGeoJSON(way) AS geometry,
      ST_Length(way) / ST_Distance(ST_StartPoint(way), ST_EndPoint(way)) AS sinuosity
    FROM planet_osm_line 
    WHERE 
      highway IN ('primary', 'secondary', 'tertiary') AND
      ST_Length(way) > 1000  -- Minimum road length
    ORDER BY sinuosity DESC
    LIMIT 50
  `);
  res.json(rows);
});

app.listen(3001, () => console.log('Server running on port 3001'));