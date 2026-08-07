export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

// Helper for optional pagination support while preserving direct array/object returns for non-paginated queries
export const formatPaginatedResponse = (items, total, page, limit) => {
  if (page && limit) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return {
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }
  return items; // Direct array return for frontend compatibility
};
