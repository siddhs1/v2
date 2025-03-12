// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// -------------------------
// Proxy Endpoint
// -------------------------
app.use(
  '/proxy',
  createProxyMiddleware({
    target: 'https://www.xrares.com',
    changeOrigin: true,
    pathRewrite: {
      '^/proxy': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('Origin', 'null');
    },
  })
);

// -------------------------
// PostgreSQL Connection
// -------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:2003@localhost:5432/videos'
});

// -------------------------
// Helper Functions
// -------------------------

// fetchWithTimeout for checking URLs
const fetchWithTimeout = (url, options, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Timeout for URL: ${url}`));
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then(response => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const baseUrls = [
  {
    proxy: "http://localhost:3001/proxy/vsrc/h264/{evideo_key}",
    original: "https://www.xrares.com/vsrc/h264/{evideo_key}"
  },
  {
    proxy: "http://localhost:3001/proxy/vsrc/HD/{evideo_key}",
    original: "https://www.xrares.com/vsrc/HD/{evideo_key}"
  },
  {
    proxy: "http://localhost:3001/proxy/vsrc/iphone/{evideo_key}",
    original: "https://www.xrares.com/vsrc/iphone/{evideo_key}"
  },
  {
    proxy: "http://localhost:3001/proxy/vsrc/h264/{evideo_key}/HD",
    original: "https://www.xrares.com/vsrc/h264/{evideo_key}/HD"
  },
  {
    proxy: "http://localhost:3001/proxy/vsrc/h264/{evideo_key}/720p",
    original: "https://www.xrares.com/vsrc/h264/{evideo_key}/720p"
  }
];

// Checks all proxy URLs concurrently and returns the original URL if working.
const findWorkingVideoURL = async (evkey, videoId) => {
  const headers = {
    'cache-control': 'no-cache',
    'Referer': 'http://localhost:3000/',
    'accept-language': 'en-US,en;q=0.9',
    'accept': '*/*',
    'pragma': 'no-cache',
    'priority': 'u=1, i'
  };

  const checkPromises = baseUrls.map(({ proxy, original }) => {
    const proxyUrl = proxy.replace("{evideo_key}", evkey);
    const originalUrl = original.replace("{evideo_key}", evkey);

    return fetchWithTimeout(proxyUrl, { method: 'HEAD', headers }, 5000)
      .then(response => (response.ok ? originalUrl : null))
      .catch(error => {
        console.error(`Error checking URL: ${proxyUrl}`, error);
        return null;
      });
  });

  const results = await Promise.all(checkPromises);
  const workingUrls = results.filter(url => url !== null);

  // Update the video's video_src in the database
  if (workingUrls.length > 0) {
    const updateQuery = 'UPDATE videos SET video_src = $1 WHERE video_id = $2';
    try {
      await pool.query(updateQuery, [workingUrls, videoId]);
      console.log('Database updated successfully');
    } catch (error) {
      console.error('Error updating database:', error);
    }
  }
  return workingUrls;
};

// Update view count when a video is viewed
const incrementViewCount = async (videoId) => {
  try {
    await pool.query('UPDATE videos SET views = views + 1 WHERE video_id = $1', [videoId]);
    console.log(`View count incremented for video ${videoId}`);
    return true;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return false;
  }
};

// -------------------------
// API Routes
// -------------------------

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Get video details by ID with view count update
app.get('/api/videos/:id', async (req, res) => {
  const videoId = parseInt(req.params.id);
  
  try {
    // Get video details
    const videoResult = await pool.query(
      `SELECT v.*, 
        v.video_src[1] AS video_src, -- Select only the first video_src
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) AS tag_details,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) AS category_details
      FROM videos v
      WHERE v.video_id = $1`,
      [videoId]
    );


    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = videoResult.rows[0];
    
    // If this is an xrares video type and video_src is empty, find and set the source
    if (video.type === 'xrares' && (!video.video_src || video.video_src.length === 0)) {
      console.log('Finding working video URL for xrares video');
      const workingUrls = await findWorkingVideoURL(video.evideo_vkey, videoId);
      
      if (workingUrls.length > 0) {
        video.video_src = workingUrls;
      } else {
        console.warn('No working URLs found for video');
      }
    }
    
    // Increment view count asynchronously
    incrementViewCount(videoId).catch(error => {
      console.error('Failed to increment view count:', error);
    });
    
    // Get related videos
let relatedVideos = [];
console.log('related_video_ids', video.related_video_ids);
if (video.related_video_ids && video.related_video_ids.length > 0) {
  const relatedResult = await pool.query(
    `SELECT video_id, title, image_src, duration, views, type
    FROM videos
    WHERE video_id = ANY($1)
    LIMIT 10`,
    [video.related_video_ids]
  );
  relatedVideos = relatedResult.rows;
} else {
  // Build the query dynamically based on available categories and tags
  let queryConditions = [];
  let queryParams = [videoId];
  let paramIndex = 2;
  
  // Only add categories condition if categories exists and is not null
  if (video.categories && video.categories.length > 0) {
    // Use && operator for array overlap - find videos that have ANY matching category
    queryConditions.push(`categories && $${paramIndex}::integer[]`);
    queryParams.push(video.categories);
    paramIndex++;
  }
  
  // Only add tags condition if tags exists and is not null
  if (video.tags && video.tags.length > 0) {
    // Use && operator for array overlap - find videos that have ANY matching tag
    queryConditions.push(`tags && $${paramIndex}::integer[]`);
    queryParams.push(video.tags);
    paramIndex++;
  }
  
  // If we have no conditions, fall back to ordering by added date
  let whereClause = `WHERE video_id != $1`;
  if (queryConditions.length > 0) {
    whereClause += ` AND (${queryConditions.join(' OR ')})`;
  }
  
  const query = `
    SELECT video_id, title, image_src, duration, views, type
    FROM videos
    ${whereClause}
    ORDER BY added DESC
    LIMIT 10
  `;
  
  console.log('Related videos query:', query);
  console.log('Query params:', queryParams);
  
  const relatedResult = await pool.query(query, queryParams);
  console.log('relatedResult', relatedResult.rows);
  relatedVideos = relatedResult.rows;
}
    // Return full video details with related videos
    res.json({
      ...video,
      related_videos: relatedVideos
    });
    
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get explore page videos (newest videos)
app.get('/api/explore', async (req, res) => {
  const { page = 1, limit = 20, category, tag } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT v.video_id, v.title, v.image_src, v.duration, v.views, v.added, v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories
      FROM videos v
      WHERE 1=1 AND EXISTS (SELECT 1 FROM UNNEST(video_src) AS element)
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Apply category filter if provided
    if (category) {
      query += ` AND (SELECT $${paramCount} = ANY(v.categories))`;
      queryParams.push(parseInt(category));
      paramCount++;
    }
    
    // Apply tag filter if provided
    if (tag) {
      query += ` AND (SELECT $${paramCount} = ANY(v.tags))`;
      queryParams.push(parseInt(tag));
      paramCount++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY v.added DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM videos v 
      WHERE 1=1
      ${category ? ' AND (SELECT $1 = ANY(v.categories))' : ''}
      ${tag ? ` AND (SELECT $${category ? 2 : 1} = ANY(v.tags))` : ''}
    `;
    
    const countParams = [];
    if (category) countParams.push(parseInt(category));
    if (tag) countParams.push(parseInt(tag));
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching explore page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending videos (most viewed)
app.get('/api/trending', async (req, res) => {
  const { page = 1, limit = 20, category, tag, period = 'week' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Determine time period filter
    let timeFilter = '';
    const now = new Date();
    
    if (period === 'day') {
      timeFilter = `AND v.added > NOW() - INTERVAL '30 day'`;
    } else if (period === 'week') {
      timeFilter = `AND v.added > NOW() - INTERVAL '100 days'`;
    } else if (period === 'month') {
      timeFilter = `AND v.added > NOW() - INTERVAL '1000 days'`;
    }
    
    let query = `
      SELECT v.video_id, v.title, v.image_src, v.duration, v.views, v.added, v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories
      FROM videos v
      WHERE 1=1 ${timeFilter}
    `;
    
    const queryParams = [];
    let paramCount = 1;
    
    // Apply category filter if provided
    if (category) {
      query += ` AND (SELECT $${paramCount} = ANY(v.categories))`;
      queryParams.push(parseInt(category));
      paramCount++;
    }
    
    // Apply tag filter if provided
    if (tag) {
      query += ` AND (SELECT $${paramCount} = ANY(v.tags))`;
      queryParams.push(parseInt(tag));
      paramCount++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY v.views DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM videos v 
      WHERE 1=1 ${timeFilter}
      ${category ? ' AND (SELECT $1 = ANY(v.categories))' : ''}
      ${tag ? ` AND (SELECT $${category ? 2 : 1} = ANY(v.tags))` : ''}
    `;
    
    const countParams = [];
    if (category) countParams.push(parseInt(category));
    if (tag) countParams.push(parseInt(tag));
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW ENDPOINT: Get recommended videos based on watch history
app.get('/api/recommended', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  // Parse watched video IDs (to exclude from results)
  const watchedIds = Array.isArray(req.query.watched) 
    ? req.query.watched.map(id => parseInt(id, 10))
    : (req.query.watched ? [parseInt(req.query.watched, 10)] : []);
  
  try {
    // If we have watch history, first find the most common categories and tags
    let topCategories = [];
    let topTags = [];
    
    if (watchedIds.length > 0) {
      // Get the most common categories from watch history
      const categoriesQuery = `
        SELECT unnest(categories) as category_id, COUNT(*) as frequency
        FROM videos
        WHERE video_id = ANY($1::integer[])
        GROUP BY category_id
        ORDER BY frequency DESC
        LIMIT 5
      `;
      
      const categoriesResult = await pool.query(categoriesQuery, [watchedIds]);
      topCategories = categoriesResult.rows.map(row => row.category_id);
      
      // Get the most common tags from watch history
      const tagsQuery = `
        SELECT unnest(tags) as tag_id, COUNT(*) as frequency
        FROM videos
        WHERE video_id = ANY($1::integer[])
        GROUP BY tag_id
        ORDER BY frequency DESC
        LIMIT 10
      `;
      
      const tagsResult = await pool.query(tagsQuery, [watchedIds]);
      topTags = tagsResult.rows.map(row => row.tag_id);
    }
    
    // Start building the query
    let query = `
      SELECT 
        v.video_id, 
        v.title, 
        v.image_src, 
        v.duration, 
        v.views, 
        v.added, 
        v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories,
    `;
    
    // Calculate relevance score based on matching categories and tags
    if (topCategories.length > 0 || topTags.length > 0) {
      query += `
        (
          CASE WHEN v.categories IS NULL THEN 0 ELSE 
            (SELECT COUNT(*) FROM UNNEST(v.categories) cat WHERE cat = ANY($1::integer[])) * 2
          END +
          CASE WHEN v.tags IS NULL THEN 0 ELSE 
            (SELECT COUNT(*) FROM UNNEST(v.tags) tag WHERE tag = ANY($2::integer[]))
          END
        ) AS relevance_score,
      `;
    } else {
      query += `0 AS relevance_score,`;
    }
    
    // Complete the query
    query += `
        random() AS random_order
      FROM videos v
      WHERE 1=1 
    `;
    
    const queryParams = [topCategories, topTags];
    let paramIndex = 3;
    
    // Exclude watched videos
    if (watchedIds.length > 0) {
      query += ` AND v.video_id <> ALL($${paramIndex}::integer[])`;
      queryParams.push(watchedIds);
      paramIndex++;
    }
    
    // Add video source existence check
    query += ` AND EXISTS (SELECT 1 FROM UNNEST(video_src) AS element)`;
    
    // Order by relevance score (if categories or tags provided) then by recent then random
    if (topCategories.length > 0 || topTags.length > 0) {
      query += ` ORDER BY relevance_score DESC, v.added DESC, random_order`;
    } else {
      query += ` ORDER BY v.added DESC`; // Default to newest if no preferences
    }
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM videos v 
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamIndex = 1;
    
    // Exclude watched videos in count query
    if (watchedIds.length > 0) {
      countQuery += ` AND v.video_id <> ALL($${countParamIndex}::integer[])`;
      countParams.push(watchedIds);
      countParamIndex++;
    }
    
    // Add video source existence check
    countQuery += ` AND EXISTS (SELECT 1 FROM UNNEST(video_src) AS element)`;
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add debug info if in development environment
    let responseObject = {
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
    
    // Add analytical data if in development mode
    if (process.env.NODE_ENV === 'development') {
      responseObject.debug = {
        topCategories,
        topTags,
        watchedIds
      };
    }
    
    res.json(responseObject);
    
  } catch (error) {
    console.error('Error fetching recommended videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search videos
app.get('/api/search', async (req, res) => {
  const { q, page = 1, limit = 20, category, tag } = req.query;
  const offset = (page - 1) * limit;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    // Create a search pattern with full text search capabilities
    const searchPattern = q.trim().split(/\s+/).join(' & ');
    
    let query = `
      SELECT v.video_id, v.title, v.image_src, v.duration, v.views, v.added, v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories,
        ts_rank_cd(to_tsvector('english', v.title), to_tsquery('english', $1)) as rank
      FROM videos v
      WHERE to_tsvector('english', v.title) @@ to_tsquery('english', $1)
    `;
    
    const queryParams = [searchPattern];
    let paramCount = 2;
    
    // Apply category filter if provided
    if (category) {
      query += ` AND (SELECT $${paramCount} = ANY(v.categories))`;
      queryParams.push(parseInt(category));
      paramCount++;
    }
    
    // Apply tag filter if provided
    if (tag) {
      query += ` AND (SELECT $${paramCount} = ANY(v.tags))`;
      queryParams.push(parseInt(tag));
      paramCount++;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY rank DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM videos v 
      WHERE to_tsvector('english', v.title) @@ to_tsquery('english', $1)
      ${category ? ' AND (SELECT $2 = ANY(v.categories))' : ''}
      ${tag ? ` AND (SELECT $${category ? 3 : 2} = ANY(v.tags))` : ''}
    `;
    
    const countParams = [searchPattern];
    if (category) countParams.push(parseInt(category));
    if (tag) countParams.push(parseInt(tag));
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tags
app.get('/api/tags', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.name, COUNT(v.video_id) AS video_count
      FROM tags t
      JOIN videos v ON t.id = ANY(v.tags)
      GROUP BY t.id
      HAVING COUNT(v.video_id) > 200
      ORDER BY video_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get videos by category
app.get('/api/categories/:id/videos', async (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const query = `
      SELECT v.video_id, v.title, v.image_src, v.duration, v.views, v.added, v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories
      FROM videos v
      WHERE $1 = ANY(v.categories)
      ORDER BY v.added DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [categoryId, parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM videos v WHERE $1 = ANY(v.categories)
    `;
    
    const countResult = await pool.query(countQuery, [categoryId]);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get category details
    const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
    const category = categoryResult.rows.length > 0 ? categoryResult.rows[0] : null;
    
    res.json({
      category,
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching category videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get videos by tag
app.get('/api/tags/:id/videos', async (req, res) => {
  const tagId = parseInt(req.params.id);
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    const query = `
      SELECT v.video_id, v.title, v.image_src, v.duration, v.views, v.added, v.type,
        (SELECT json_agg(t) FROM tags t WHERE t.id = ANY(v.tags)) as tags,
        (SELECT json_agg(c) FROM categories c WHERE c.id = ANY(v.categories)) as categories
      FROM videos v
      WHERE $1 = ANY(v.tags)
      ORDER BY v.added DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [tagId, parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM videos v WHERE $1 = ANY(v.tags)
    `;
    
    const countResult = await pool.query(countQuery, [tagId]);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get tag details
    const tagResult = await pool.query('SELECT * FROM tags WHERE id = $1', [tagId]);
    const tag = tagResult.rows.length > 0 ? tagResult.rows[0] : null;
    
    res.json({
      tag,
      videos: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching tag videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------------
// COMMENTS API
// -------------------------

// Get comments for a specific video
app.get('/api/videos/:id/comments', async (req, res) => {
  const videoId = parseInt(req.params.id);
  const { page = 1, limit = 20, sort = 'newest' } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Determine sort order
    let orderBy = 'c.posted_date DESC'; // Default newest first
    if (sort === 'oldest') {
      orderBy = 'c.posted_date ASC';
    } else if (sort === 'most_points') {
      orderBy = 'c.points DESC';
    }
    
    const query = `
      SELECT c.*
      FROM comments c
      WHERE c.video_id = $1
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [videoId, parseInt(limit), parseInt(offset)]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM comments WHERE video_id = $1
    `;
    
    const countResult = await pool.query(countQuery, [videoId]);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      comments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new comment
app.post('/api/comments', async (req, res) => {
  const { video_id, username, comment_text, is_guest = true, original_comment_id = null } = req.body;
  
  if (!video_id || !comment_text) {
    return res.status(400).json({ error: 'Video ID and comment text are required' });
  }
  
  try {
    const now = new Date();
    
    const query = `
      INSERT INTO comments (
        video_id, username, comment_text, is_guest, 
        created_at, updated_at, posted_date, points,
        original_comment_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      parseInt(video_id),
      username || 'Anonymous',
      comment_text,
      is_guest,
      now,
      now,
      now,
      0, // Initial points
      original_comment_id
    ]);
    
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a comment
app.put('/api/comments/:id', async (req, res) => {
  const commentId = parseInt(req.params.id);
  const { comment_text } = req.body;
  
  if (!comment_text) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  try {
    const now = new Date();
    
    // First check if comment exists
    const checkQuery = 'SELECT * FROM comments WHERE comment_id = $1';
    const checkResult = await pool.query(checkQuery, [commentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const query = `
      UPDATE comments
      SET comment_text = $1, updated_at = $2
      WHERE comment_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(query, [comment_text, now, commentId]);
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
app.delete('/api/comments/:id', async (req, res) => {
  const commentId = parseInt(req.params.id);
  
  try {
    // First check if comment exists
    const checkQuery = 'SELECT * FROM comments WHERE comment_id = $1';
    const checkResult = await pool.query(checkQuery, [commentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const query = 'DELETE FROM comments WHERE comment_id = $1';
    await pool.query(query, [commentId]);
    
    res.json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on a comment (upvote/downvote)
app.post('/api/comments/:id/vote', async (req, res) => {
  const commentId = parseInt(req.params.id);
  const { vote } = req.body; // 1 for upvote, -1 for downvote
  
  if (vote !== 1 && vote !== -1) {
    return res.status(400).json({ error: 'Vote must be 1 (upvote) or -1 (downvote)' });
  }
  
  try {
    // First check if comment exists
    const checkQuery = 'SELECT * FROM comments WHERE comment_id = $1';
    const checkResult = await pool.query(checkQuery, [commentId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const query = `
      UPDATE comments
      SET points = points + $1
      WHERE comment_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [vote, commentId]);
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get replies to a comment
app.get('/api/comments/:id/replies', async (req, res) => {
  const originalCommentId = req.params.id;
  
  try {
    const query = `
      SELECT * FROM comments
      WHERE original_comment_id = $1
      ORDER BY posted_date ASC
    `;
    
    const result = await pool.query(query, [originalCommentId]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;