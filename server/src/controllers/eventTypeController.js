import { query } from "../config/db.js";
import { createHttpError, isValidColorHex, isValidSlug } from "../utils/http.js";

const adminUserId = 1;

const normalizeEventPayload = (body) => {
  const payload = {
    name: body.name?.trim(),
    slug: body.slug?.trim().toLowerCase(),
    durationMinutes: Number(body.durationMinutes),
    description: body.description?.trim() || null,
    location: body.location?.trim() || "Google Meet",
    colorHex: body.colorHex || "#006bff",
    isActive: Boolean(body.isActive)
  };

  if (!payload.name) {
    throw createHttpError(400, "Event name is required.");
  }

  if (!payload.slug || !isValidSlug(payload.slug)) {
    throw createHttpError(400, "Slug must use lowercase letters, numbers, and hyphens only.");
  }

  if (!Number.isInteger(payload.durationMinutes) || payload.durationMinutes < 15) {
    throw createHttpError(400, "Duration must be at least 15 minutes.");
  }

  if (!payload.location) {
    throw createHttpError(400, "Location is required.");
  }

  if (!isValidColorHex(payload.colorHex)) {
    throw createHttpError(400, "Color must be a valid hex value.");
  }

  return payload;
};

export const listEventTypes = async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS "durationMinutes",
          description,
          location,
          color_hex AS "colorHex",
          is_active AS "isActive",
          created_at AS "createdAt"
       FROM event_types
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [adminUserId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const createEventType = async (req, res, next) => {
  try {
    const { name, slug, durationMinutes, description, location, colorHex, isActive } = normalizeEventPayload(req.body);
    const result = await query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, description, location, color_hex, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [adminUserId, name, slug, durationMinutes, description || null, location || "Google Meet", colorHex, isActive],
    );
    const created = result[0];
    
    const fullRecord = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS "durationMinutes",
          description,
          location,
          color_hex AS "colorHex",
          is_active AS "isActive",
          created_at AS "createdAt"
       FROM event_types
       WHERE id = $1`,
      [created.id],
    );
    res.status(201).json(fullRecord[0]);
  } catch (error) {
    next(error);
  }
};

export const updateEventType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, durationMinutes, description, location, colorHex, isActive } = normalizeEventPayload(req.body);
    const result = await query(
      `UPDATE event_types
       SET name = $1, slug = $2, duration_minutes = $3, description = $4, location = $5, color_hex = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9`,
      [name, slug, durationMinutes, description || null, location || "Google Meet", colorHex, isActive, id, adminUserId],
    );

    if (result.length === 0) {
      throw createHttpError(404, "Event type not found.");
    }

    const updated = await query(
      `SELECT
          id,
          name,
          slug,
          duration_minutes AS "durationMinutes",
          description,
          location,
          color_hex AS "colorHex",
          is_active AS "isActive",
          created_at AS "createdAt"
       FROM event_types
       WHERE id = $1`,
      [id],
    );
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
};

export const deleteEventType = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM event_types WHERE id = $1 AND user_id = $2", [req.params.id, adminUserId]);
    if (result.length === 0) {
      throw createHttpError(404, "Event type not found.");
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
