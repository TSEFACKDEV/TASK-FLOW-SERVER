"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewsByUser = exports.getReviewsForUser = exports.deleteReview = exports.updateReview = exports.createReview = exports.getReviewById = exports.getAllReviews = void 0;
const response_js_1 = __importDefault(require("../helper/response.js"));
const prisma_client_js_1 = __importDefault(require("../model/prisma.client.js"));
const getAllReviews = async (_req, res) => {
    try {
        const reviews = await prisma_client_js_1.default.review.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        response_js_1.default.success(res, 'Reviews retrieved successfully', reviews);
    }
    catch (error) {
        console.error('Error retrieving reviews:', error);
        response_js_1.default.error(res, 'Failed to retrieve reviews', 500);
    }
};
exports.getAllReviews = getAllReviews;
const getReviewById = async (req, res) => {
    const id = req.params.id;
    try {
        if (!id) {
            return response_js_1.default.error(res, 'Review ID is required', null, 422);
        }
        const review = await prisma_client_js_1.default.review.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        if (!review) {
            return response_js_1.default.notFound(res, 'Review not found', 404);
        }
        response_js_1.default.success(res, 'Review retrieved successfully', review);
    }
    catch (error) {
        console.error('Error retrieving review:', error);
        response_js_1.default.error(res, 'Failed to retrieve review', 500);
    }
};
exports.getReviewById = getReviewById;
const createReview = async (req, res) => {
    const { sellerId, rating } = req.body;
    if (!req.authUser?.id) {
        return response_js_1.default.error(res, 'User not authenticated', null, 401);
    }
    const userId = req.authUser?.id;
    try {
        if (!sellerId || !rating) {
            return response_js_1.default.error(res, 'Seller ID and rating are required', null, 400);
        }
        if (rating < 1 || rating > 5) {
            return response_js_1.default.error(res, 'Rating must be between 1 and 5', null, 400);
        }
        if (userId === sellerId) {
            return response_js_1.default.error(res, 'You cannot rate yourself', null, 400);
        }
        const seller = await prisma_client_js_1.default.user.findUnique({
            where: { id: sellerId },
        });
        if (!seller) {
            return response_js_1.default.notFound(res, 'Seller not found', 404);
        }
        const existingReview = await prisma_client_js_1.default.review.findFirst({
            where: {
                userId: userId,
                authorId: sellerId,
            },
        });
        if (existingReview) {
            return response_js_1.default.error(res, 'You have already rated this seller', null, 400);
        }
        const review = await prisma_client_js_1.default.review.create({
            data: {
                authorId: sellerId,
                userId,
                rating,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        response_js_1.default.success(res, 'Review created successfully', review, 201);
    }
    catch (error) {
        console.error('Error creating review:', error);
        response_js_1.default.error(res, 'Failed to create review', 500);
    }
};
exports.createReview = createReview;
const updateReview = async (req, res) => {
    const id = req.params.id;
    const { rating } = req.body;
    const userId = req.authUser?.id;
    try {
        if (!id) {
            return response_js_1.default.error(res, 'Review ID is required', null, 422);
        }
        if (!rating || rating < 1 || rating > 5) {
            return response_js_1.default.error(res, 'Valid rating (1-5) is required', null, 400);
        }
        const review = await prisma_client_js_1.default.review.findUnique({
            where: { id },
        });
        if (!review) {
            return response_js_1.default.notFound(res, 'Review not found', 404);
        }
        if (review.userId !== userId) {
            return response_js_1.default.error(res, 'You can only update your own reviews', null, 403);
        }
        const updatedReview = await prisma_client_js_1.default.review.update({
            where: { id },
            data: {
                rating,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        });
        response_js_1.default.success(res, 'Review updated successfully', updatedReview);
    }
    catch (error) {
        console.error('Error updating review:', error);
        response_js_1.default.error(res, 'Failed to update review', 500);
    }
};
exports.updateReview = updateReview;
const deleteReview = async (req, res) => {
    const id = req.params.id;
    const userId = req.authUser?.id;
    try {
        if (!id) {
            return response_js_1.default.error(res, 'Review ID is required', null, 422);
        }
        const review = await prisma_client_js_1.default.review.findUnique({
            where: { id },
        });
        if (!review) {
            return response_js_1.default.notFound(res, 'Review not found', 404);
        }
        if (review.userId !== userId) {
            return response_js_1.default.error(res, 'You can only delete your own reviews', null, 403);
        }
        await prisma_client_js_1.default.review.delete({
            where: { id },
        });
        response_js_1.default.success(res, 'Review deleted successfully', null);
    }
    catch (error) {
        console.error('Error deleting review:', error);
        response_js_1.default.error(res, 'Failed to delete review', 500);
    }
};
exports.deleteReview = deleteReview;
const getReviewsForUser = async (req, res) => {
    const sellerId = req.params.userId;
    try {
        if (!sellerId) {
            return response_js_1.default.error(res, 'Seller ID is required', null, 422);
        }
        const seller = await prisma_client_js_1.default.user.findUnique({
            where: { id: sellerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
            },
        });
        if (!seller) {
            return response_js_1.default.notFound(res, 'Seller not found', 404);
        }
        const reviews = await prisma_client_js_1.default.review.findMany({
            where: { authorId: sellerId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
            : 0;
        const ratingDistribution = {
            5: reviews.filter((r) => r.rating === 5).length,
            4: reviews.filter((r) => r.rating === 4).length,
            3: reviews.filter((r) => r.rating === 3).length,
            2: reviews.filter((r) => r.rating === 2).length,
            1: reviews.filter((r) => r.rating === 1).length,
        };
        response_js_1.default.success(res, 'Seller reviews retrieved successfully', {
            seller,
            reviews,
            statistics: {
                totalReviews,
                averageRating,
                ratingDistribution,
            },
        });
    }
    catch (error) {
        console.error('Error retrieving reviews for seller:', error);
        response_js_1.default.error(res, 'Failed to retrieve reviews for seller', 500);
    }
};
exports.getReviewsForUser = getReviewsForUser;
const getReviewsByUser = async (req, res) => {
    const userId = req.authUser?.id;
    try {
        const reviews = await prisma_client_js_1.default.review.findMany({
            where: { userId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        response_js_1.default.success(res, 'Your reviews retrieved successfully', reviews);
    }
    catch (error) {
        console.error('Error retrieving user reviews:', error);
        response_js_1.default.error(res, 'Failed to retrieve your reviews', 500);
    }
};
exports.getReviewsByUser = getReviewsByUser;
