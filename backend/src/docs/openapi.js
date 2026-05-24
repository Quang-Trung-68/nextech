/**
 * openapi.js
 * Định nghĩa chi tiết đặc tả OpenAPI 3.0.3 cho hệ thống NexTech.
 */

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'NexTech REST API Documentation',
    version: '1.0.0',
    description: `Chào mừng bạn đến với tài liệu API chính thức của hệ thống thương mại điện tử **NexTech**.

Hệ thống API này cung cấp đầy đủ các cổng kết nối cho Client, bao gồm:
- Xác thực người dùng (Authentication) hỗ trợ cả cơ chế **HttpOnly Cookies** và **Bearer Tokens**.
- Quản lý danh mục & sản phẩm (Products & Categories).
- Giỏ hàng & Thanh toán (Cart, Orders, Stripe & SePay).
- Hệ thống tin tức (News / Blog).
- Hỗ trợ giải đáp khách hàng bằng AI (AI Chat integration).

*Tài liệu được kết xuất đẹp mắt và trực quan nhờ giao diện Scalar.*`,
    contact: {
      name: 'NexTech Technical Team',
      email: 'support@nextech.io.vn',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
    {
      url: 'https://api.nextech.io.vn',
      description: 'Production API Server (VPS)',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'Đăng ký, đăng nhập, quản lý phiên và tài khoản' },
    { name: 'Products', description: 'Tìm kiếm, lọc danh sách và xem chi tiết sản phẩm' },
    { name: 'Cart', description: 'Quản lý giỏ hàng tạm thời của khách hàng' },
    { name: 'Orders', description: 'Tạo đơn hàng, theo dõi lịch sử mua sắm và thanh toán' },
    { name: 'Posts', description: 'Xem và tương tác với các bài viết tin tức/blog công nghệ' },
    { name: 'AI Chat', description: 'Tương tác với trợ lý mua sắm AI thông minh' },
  ],
  paths: {
    // ─── AUTHENTICATION ───────────────────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng ký tài khoản',
        description: 'Tạo tài khoản khách hàng mới bằng email và mật khẩu.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Nguyen Van A', minLength: 2, maxLength: 50 },
                  email: { type: 'string', format: 'email', example: 'vana@nextech.io.vn' },
                  password: { 
                    type: 'string', 
                    format: 'password', 
                    example: 'Mypassword123',
                    description: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số'
                  },
                },
                required: ['name', 'email', 'password'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Đăng ký tài khoản thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registration successful' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Thông tin đăng ký không hợp lệ hoặc email đã được sử dụng',
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng nhập',
        description: 'Xác thực tài khoản và cấp JWT (thông qua cookie HttpOnly `access_token` và `refresh_token`).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'vana@nextech.io.vn' },
                  password: { type: 'string', format: 'password', example: 'Mypassword123' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Đăng nhập thành công. Cả access_token và refresh_token đều được lưu trong cookie.',
            headers: {
              'Set-Cookie': {
                schema: { type: 'string', example: 'access_token=...; Path=/; HttpOnly; Secure; SameSite=Lax' }
              }
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Email hoặc mật khẩu không chính xác',
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Đăng xuất',
        description: 'Xoá các cookie chứa JWT và thu hồi refresh token trên cơ sở dữ liệu.',
        responses: {
          200: {
            description: 'Đăng xuất thành công, xoá cookie.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Làm mới Token (Rotate JWT)',
        description: 'Sử dụng cookie `refresh_token` để cấp mới cặp token khác (Access & Refresh) theo cơ chế luân chuyển (rotation).',
        responses: {
          200: {
            description: 'Cấp mới token thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token rotated successfully' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Refresh token không tồn tại, hết hạn hoặc bị thu hồi (đã bị dùng lại trước đó)',
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy thông tin tài khoản hiện tại',
        description: 'Trả về thông tin của tài khoản đang đăng nhập hiện tại.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lấy thông tin tài khoản thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Chưa đăng nhập hoặc token không hợp lệ',
          },
        },
      },
    },

    // ─── PRODUCTS ─────────────────────────────────────────────────────────────
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Lấy danh sách sản phẩm',
        description: 'Lấy danh sách sản phẩm kết hợp tìm kiếm, lọc theo danh mục, giá, thương hiệu, sắp xếp và phân trang.',
        parameters: [
          { name: 'search', in: 'query', description: 'Từ khóa tìm kiếm theo tên/mô tả', required: false, schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', description: 'Lọc theo ID danh mục', required: false, schema: { type: 'string' } },
          { name: 'brandId', in: 'query', description: 'Lọc theo ID thương hiệu', required: false, schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', description: 'Giá tối thiểu', required: false, schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', description: 'Giá tối đa', required: false, schema: { type: 'number' } },
          { name: 'sortBy', in: 'query', description: 'Trường sắp xếp (price, createdAt, rating)', required: false, schema: { type: 'string', enum: ['price', 'createdAt', 'rating'], default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', description: 'Chiều sắp xếp (asc, desc)', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', description: 'Số trang hiển thị (bắt đầu từ 1)', required: false, schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', description: 'Số lượng sản phẩm mỗi trang', required: false, schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: {
            description: 'Lấy danh sách sản phẩm thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    pagination: {
                      type: 'object',
                      properties: {
                        totalItems: { type: 'integer', example: 45 },
                        totalPages: { type: 'integer', example: 4 },
                        currentPage: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 12 }
                      }
                    },
                    products: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Xem chi tiết sản phẩm',
        description: 'Trả về thông tin chi tiết của một sản phẩm bằng ID bao gồm cả các thuộc tính, biến thể và đánh giá.',
        parameters: [
          { name: 'id', in: 'path', description: 'ID của sản phẩm', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Tìm thấy sản phẩm',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    product: { 
                      allOf: [
                        { $ref: '#/components/schemas/Product' },
                        {
                          type: 'object',
                          properties: {
                            description: { type: 'string', example: 'Mô tả chi tiết sản phẩm điện thoại flagship...' },
                            attributes: { type: 'array', items: { type: 'object' } },
                            variants: { type: 'array', items: { type: 'object' } },
                            reviews: { type: 'array', items: { type: 'object' } }
                          }
                        }
                      ]
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'Không tìm thấy sản phẩm với ID được cấp',
          },
        },
      },
    },

    // ─── CART ─────────────────────────────────────────────────────────────────
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Lấy thông tin giỏ hàng',
        description: 'Lấy danh sách toàn bộ các sản phẩm hiện có trong giỏ hàng của người dùng.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lấy thông tin giỏ hàng thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    cart: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'cart-123' },
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/CartItem' }
                        },
                        totalPrice: { type: 'number', example: 1299.99 }
                      }
                    }
                  },
                },
              },
            },
          },
          401: { description: 'Chưa đăng nhập' }
        },
      },
    },
    '/api/cart/add': {
      post: {
        tags: ['Cart'],
        summary: 'Thêm sản phẩm vào giỏ hàng',
        description: 'Thêm mới hoặc tăng số lượng của một sản phẩm/biến thể sản phẩm trong giỏ hàng.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  productId: { type: 'string', example: 'prod-001' },
                  productVariantId: { type: 'string', example: 'var-999', description: 'ID của biến thể (nếu có)', nullable: true },
                  quantity: { type: 'integer', example: 1, minimum: 1 },
                },
                required: ['productId', 'quantity'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Đã thêm sản phẩm vào giỏ hàng thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Item added to cart' },
                  },
                },
              },
            },
          },
          400: { description: 'Số lượng không hợp lệ hoặc sản phẩm đã hết hàng' },
          401: { description: 'Chưa đăng nhập' }
        },
      },
    },

    // ─── ORDERS ───────────────────────────────────────────────────────────────
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Tạo đơn đặt hàng mới',
        description: 'Tạo đơn hàng từ giỏ hàng hiện tại của khách hàng. Hỗ trợ thanh toán bằng Stripe (thẻ quốc tế) hoặc VietQR/SePay (chuyển khoản ngân hàng nội địa).',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shippingAddress: { type: 'string', example: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
                  shippingPhone: { type: 'string', example: '0901234567' },
                  paymentMethod: { type: 'string', enum: ['STRIPE', 'SEPAY'], example: 'SEPAY' },
                  couponCode: { type: 'string', example: 'SUMMER2026', nullable: true },
                },
                required: ['shippingAddress', 'shippingPhone', 'paymentMethod'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Đơn hàng đã được khởi tạo thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Order created successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                    // Nếu là thanh toán Stripe, sẽ trả về clientSecret để frontend render form
                    clientSecret: { type: 'string', example: 'pi_3MtwKsJLk3KJS_secret_xxx', nullable: true },
                    // Nếu là thanh toán SePay, sẽ trả về link cổng thanh toán
                    sepayCheckoutUrl: { type: 'string', example: 'https://checkout.sepay.vn/payment/intent/...', nullable: true }
                  },
                },
              },
            },
          },
          400: { description: 'Lỗi giỏ hàng trống, mã giảm giá sai hoặc hết hàng trong kho' },
          401: { description: 'Chưa đăng nhập' }
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'Lấy lịch sử đơn hàng',
        description: 'Lấy danh sách tất cả các đơn hàng đã đặt của người dùng đang đăng nhập.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lấy lịch sử đơn hàng thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    orders: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Chưa đăng nhập' }
        }
      }
    },

    // ─── POSTS ────────────────────────────────────────────────────────────────
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Lấy danh sách bài viết blog/tin tức',
        description: 'Xem tất cả bài viết tin tức công nghệ đã xuất bản.',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } },
        ],
        responses: {
          200: {
            description: 'Lấy bài viết thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    posts: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'post-001' },
                          title: { type: 'string', example: 'Xu hướng công nghệ năm 2026' },
                          slug: { type: 'string', example: 'xu-huong-cong-nghe-nam-2026' },
                          summary: { type: 'string', example: 'Tóm tắt các đột phá trí tuệ nhân tạo...' },
                          thumbnail: { type: 'string', example: 'https://cloudinary.com/image.jpg' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ─── AI CHAT ──────────────────────────────────────────────────────────────
    '/api/ai-chat': {
      post: {
        tags: ['AI Chat'],
        summary: 'Hỏi đáp với Trợ lý AI',
        description: 'Tương tác trực tiếp với mô hình Gemini AI được tinh chỉnh để tư vấn sản phẩm, giải đáp thắc mắc đơn hàng cho người dùng.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Hãy tư vấn giúp tôi dòng điện thoại nào chơi game tốt nhất tầm giá 15 triệu' }
                },
                required: ['message']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'AI phản hồi thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    reply: { type: 'string', example: 'Trong tầm giá 15 triệu, mẫu X là sự lựa chọn tối ưu nhất nhờ chip Snapdragon đời mới cùng hệ thống tản nhiệt...' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Xác thực qua cookie tự động gửi kèm (`access_token`). Thích hợp khi test trên Web Client.'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Gửi JWT Token kèm theo Header: `Authorization: Bearer <token>`'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr-872412' },
          name: { type: 'string', example: 'Nguyen Van A' },
          email: { type: 'string', format: 'email', example: 'vana@nextech.io.vn' },
          role: { type: 'string', example: 'USER', enum: ['USER', 'ADMIN'] },
          isEmailVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'prod-001' },
          name: { type: 'string', example: 'iPhone 15 Pro Max 256GB' },
          slug: { type: 'string', example: 'iphone-15-pro-max-256gb' },
          price: { type: 'number', example: 1199.99 },
          originalPrice: { type: 'number', example: 1299.99, nullable: true },
          summary: { type: 'string', example: 'Điện thoại cao cấp của Apple năm 2023 với khung Titan...' },
          stockType: { type: 'string', example: 'SIMPLE', enum: ['SIMPLE', 'SERIAL'] },
          stockCount: { type: 'integer', example: 25 },
          thumbnail: { type: 'string', example: 'https://cloudinary.com/product_thumbnail.jpg' },
          averageRating: { type: 'number', example: 4.8 },
          reviewCount: { type: 'integer', example: 120 }
        }
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'item-891' },
          productId: { type: 'string', example: 'prod-001' },
          product: { $ref: '#/components/schemas/Product' },
          productVariantId: { type: 'string', example: 'var-999', nullable: true },
          productVariant: { type: 'object', nullable: true },
          quantity: { type: 'integer', example: 2 },
          priceAtAdd: { type: 'number', example: 1199.99 }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ord-812042' },
          orderNumber: { type: 'string', example: 'NT-20260524-ABCDE' },
          userId: { type: 'string', example: 'usr-872412' },
          totalAmount: { type: 'number', example: 2399.98 },
          shippingAddress: { type: 'string', example: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
          shippingPhone: { type: 'string', example: '0901234567' },
          paymentMethod: { type: 'string', example: 'SEPAY' },
          paymentStatus: { type: 'string', example: 'PENDING_PAYMENT', enum: ['PENDING_PAYMENT', 'PAID', 'REFUNDED', 'FAILED'] },
          orderStatus: { type: 'string', example: 'PENDING', enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

module.exports = openApiSpec;
