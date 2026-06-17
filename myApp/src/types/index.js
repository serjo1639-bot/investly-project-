/**
 * types/index.js — JSDoc typedefs mirroring the backend DTOs.
 *
 * This project is JavaScript, so these typedefs document the shapes the API
 * returns and power editor autocomplete/inline type-checking without a build
 * step. Import for IntelliSense:  /** @type {import('../types').Project} *\/
 *
 * Field names are camelCase to match the backend's JSON naming policy.
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string=} message
 * @property {*} data
 * @property {string[]=} errors
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string=} email
 * @property {string=} phone
 * @property {'investor'|'owner'|'admin'|'guest'} role
 * @property {'active'|'pending'|'suspended'|'banned'} status
 * @property {'none'|'pending'|'approved'|'rejected'} kycStatus
 * @property {number=} age
 * @property {'male'|'female'|'other'=} gender
 * @property {string=} location
 * @property {string=} passportUrl
 * @property {string=} avatarUrl
 * @property {string=} bio
 * @property {string=} companyName
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} AuthResult
 * @property {User} user
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {string=} tokenType
 * @property {number=} expiresIn
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string=} icon
 */

/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {string=} summary
 * @property {string=} coverUrl
 * @property {string=} categoryId
 * @property {string=} categoryName
 * @property {'pending'|'active'|'completed'|'inactive'|'rejected'} status
 * @property {number} goalAmount
 * @property {number} raisedAmount
 * @property {number=} minInvestment
 * @property {number=} investorsCount
 * @property {number=} views
 * @property {boolean=} featured
 * @property {string=} ownerId
 * @property {string=} ownerName
 * @property {string=} deadline
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} Wallet
 * @property {string} id
 * @property {number} balance
 * @property {string=} currency
 * @property {'active'|'frozen'|'inactive'} status
 */

/**
 * @typedef {Object} WalletTransaction
 * @property {string} id
 * @property {'credit'|'debit'} type
 * @property {number} amount
 * @property {'completed'|'pending'|'failed'|'refunded'} status
 * @property {string=} description
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} Investment
 * @property {string} id
 * @property {string} projectId
 * @property {string=} projectTitle
 * @property {number} amount
 * @property {'pending'|'completed'|'failed'|'cancelled'} status
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {number} amount
 * @property {'wallet'|'credit_card'} method
 * @property {'pending'|'completed'|'failed'|'refunded'} status
 * @property {string=} reference
 * @property {string=} createdAt
 */

/**
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {'investment'|'project'|'system'|'user'} type
 * @property {string} title
 * @property {string=} body
 * @property {boolean} isRead
 * @property {string=} createdAt
 */

export {}; // module marker; this file only exports types
