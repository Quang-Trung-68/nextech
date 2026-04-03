const prisma = require('./prisma');

/**
 * Query ?category=... thường dùng mã ngắn (smartphone, laptop) trong khi DB lưu tiếng Việt (seed).
 * Map sang đúng giá trị Product.category.
 */
const CATEGORY_QUERY_ALIASES = {
  smartphone: 'Điện thoại',
  phone: 'Điện thoại',
  laptop: 'Laptop',
  tablet: 'Máy tính bảng',
  accessory: 'Phụ kiện',
};

function normalizeCategoryParam(value) {
  if (typeof value !== 'string' || !value.trim()) return value;
  const trimmed = value.trim();
  return CATEGORY_QUERY_ALIASES[trimmed] || trimmed;
}

class ApiFeatures {
  constructor(queryParams) {
    this.queryParams = queryParams;
    this.queryString = {};
  }

  search() {
    if (this.queryParams.search) {
      this.queryString.name = {
        contains: this.queryParams.search,
        mode: 'insensitive',
      };
    }
    return this;
  }

  filter() {
    if (this.queryParams.category) {
      if (typeof this.queryParams.category === 'string' && this.queryParams.category.includes(',')) {
        const parts = this.queryParams.category.split(',').map((c) => normalizeCategoryParam(c.trim()));
        this.queryString.category = { in: parts };
      } else {
        this.queryString.category = normalizeCategoryParam(this.queryParams.category);
      }
    }

    const brandSlugParam = this.queryParams.brandSlug || this.queryParams.brand;
    if (brandSlugParam) {
      const slugs =
        typeof brandSlugParam === 'string' && brandSlugParam.includes(',')
          ? brandSlugParam.split(',').map((s) => s.trim()).filter(Boolean)
          : [String(brandSlugParam).trim()];
      if (slugs.length === 1) {
        this.queryString.brand = { slug: slugs[0] };
      } else {
        this.queryString.brand = { slug: { in: slugs } };
      }
    }

    if (this.queryParams.minPrice || this.queryParams.maxPrice) {
      this.queryString.price = {};
      if (this.queryParams.minPrice) {
        this.queryString.price.gte = parseFloat(this.queryParams.minPrice);
      }
      if (this.queryParams.maxPrice) {
        this.queryString.price.lte = parseFloat(this.queryParams.maxPrice);
      }
    }

    if (this.queryParams.highlight) {
      const parts = this.queryParams.highlight.split(',').map((p) => p.trim());
      const orConditions = [];

      if (parts.includes('new-arrival')) {
        orConditions.push({ isNewArrival: true });
      }
      if (parts.includes('on-sale')) {
        orConditions.push({
          salePrice: { not: null },
          AND: [
            {
              OR: [
                { saleExpiresAt: null },
                { saleExpiresAt: { gt: new Date() } }
              ]
            },
            {
              OR: [
                { saleStock: null },
                { saleSoldCount: { lt: prisma.product.fields.saleStock } }
              ]
            }
          ]
        });
      }
      if (parts.includes('bestseller')) {
        orConditions.push({ isBestseller: true });
      }
      if (parts.includes('top-rated')) {
        orConditions.push({ rating: { gte: 4.5 } });
      }

      if (orConditions.length > 0) {
        this.queryString.OR = orConditions;
      }
    }

    return this;
  }

  sort() {
    this.orderBy = {};
    if (this.queryParams.sort) {
      switch (this.queryParams.sort) {
        case 'price_asc':
          this.orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          this.orderBy = { price: 'desc' };
          break;
        case 'oldest':
          this.orderBy = { createdAt: 'asc' };
          break;
        case 'newest':
        default:
          this.orderBy = { createdAt: 'desc' };
          break;
      }
    } else {
      this.orderBy = { createdAt: 'desc' }; // Default
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = parseInt(this.queryParams.limit, 10) || 12;
    const skip = (page - 1) * limit;

    this.paginationParams = {
      skip,
      take: limit,
      page,
      limit,
    };

    return this;
  }

  build() {
    return {
      where: this.queryString,
      orderBy: this.orderBy,
      ...this.paginationParams,
    };
  }
}

module.exports = ApiFeatures;
