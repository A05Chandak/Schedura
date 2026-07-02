import { query } from "../config/db.js";
import { createHttpError, isValidTime } from "../utils/http.js";

const adminUserId = 1;

export const getAvailability = async (_req, res, next) => {
  try {
    const settingsResult = await query(
      "SELECT timezone FROM availability_settings WHERE user_id = ?",
      [adminUserId],
    );
    const settings = settingsResult[0];
    
    const weeklyHours = await query(
      `SELECT
          id,
          day_of_week AS "dayOfWeek",
          is_enabled AS "isEnabled",
          TO_CHAR(start_time, 'HH24:MI') AS "startTime",
          TO_CHAR(end_time, 'HH24:MI') AS "endTime"
       FROM availability_rules
       WHERE user_id = ?
       ORDER BY day_of_week`,
      [adminUserId],
    );
    res.json({
      timezone: settings?.timezone || "Asia/Kolkata",
      weeklyHours
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const { timezone, weeklyHours } = req.body;

    if (!timezone || !Intl.supportedValuesOf("timeZone").includes(timezone)) {
      throw createHttpError(400, "Please select a valid timezone.");
    }

    if (!Array.isArray(weeklyHours) || weeklyHours.length !== 7) {
      throw createHttpError(400, "Weekly hours must contain all 7 days.");
    }

    for (const item of weeklyHours) {
      if (typeof item.dayOfWeek !== "number" || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        throw createHttpError(400, "Each availability row must include a valid day of week.");
      }

      if (!isValidTime(item.startTime) || !isValidTime(item.endTime)) {
        throw createHttpError(400, "Availability times must use HH:mm format.");
      }

      if (item.isEnabled && item.startTime >= item.endTime) {
        throw createHttpError(400, "End time must be later than start time for enabled days.");
      }
    }

    await query(
      `INSERT INTO availability_settings (user_id, timezone)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET timezone = EXCLUDED.timezone`,
      [adminUserId, timezone],
    );

    for (const item of weeklyHours) {
      await query(
        `UPDATE availability_rules
         SET is_enabled = $1, start_time = $2, end_time = $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND day_of_week = $5`,
        [item.isEnabled, item.startTime, item.endTime, adminUserId, item.dayOfWeek],
      );
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
