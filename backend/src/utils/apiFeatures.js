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
        this.queryString.category = { in: this.queryParams.category.split(',') };
      } else {
        this.queryString.category = this.queryParams.category;
      }
    }

    if (this.queryParams.brand) {
      if (typeof this.queryParams.brand === 'string' && this.queryParams.brand.includes(',')) {
        this.queryString.brand = { in: this.queryParams.brand.split(',') };
      } else {
        this.queryString.brand = this.queryParams.brand;
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
