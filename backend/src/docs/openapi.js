/**
 * openapi.js
 * Định nghĩa TOÀN BỘ 100% đặc tả API chuẩn OpenAPI 3.0.3 cho hệ thống NexTech.
 */

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'NexTech REST API Documentation',
    version: '1.0.0',
    description: `Chào mừng bạn đến với tài liệu API chính thức và toàn diện nhất của hệ thống thương mại điện tử **NexTech**.

Hệ thống tài liệu này bao gồm **tất cả mọi endpoint** có mặt trong dự án, được chia nhóm mạch lạc:
- **Client REST APIs**: Toàn bộ luồng nghiệp vụ cho người dùng (Auth, Profile, Products, Cart, Orders, Reviews, Favorites, Notifications, Coupons, Blog, AI Chat).
- **Admin Management APIs**: Hệ thống quản trị toàn diện (Dashboard Stats, User roles, Product variants, Inventory/Serials tracking, Invoices, Banner/Brand, Settings).

*Giao diện tài liệu được thiết kế theo phong cách 3 cột hiện đại của Scalar, hỗ trợ Dark Mode và chạy thử (Try it out) trực tiếp.*`,
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
    { name: 'User Profile & Addresses', description: 'Thông tin cá nhân, cập nhật avatar và quản lý sổ địa chỉ' },
    { name: 'Products', description: 'Tìm kiếm, lọc danh sách và xem chi tiết sản phẩm' },
    { name: 'Cart', description: 'Quản lý giỏ hàng tạm thời của khách hàng' },
    { name: 'Orders', description: 'Tạo đơn hàng, theo dõi lịch sử mua sắm và thanh toán' },
    { name: 'Reviews', description: 'Đánh giá sản phẩm sau khi đã nhận hàng' },
    { name: 'Favorites', description: 'Danh sách sản phẩm yêu thích của khách hàng' },
    { name: 'Notifications', description: 'Thông báo cá nhân và xác thực Pusher/Soketi' },
    { name: 'Coupons', description: 'Áp dụng và quản lý mã giảm giá' },
    { name: 'Categories & Tags', description: 'Xem và phân loại sản phẩm theo danh mục và thẻ' },
    { name: 'Posts', description: 'Xem bài viết tin tức/blog công nghệ' },
    { name: 'AI Chat', description: 'Tương tác với trợ lý mua sắm AI thông minh' },
    { name: 'Admin General', description: 'Quản trị hệ thống: Thống kê, Quản lý tài khoản, Quản lý sản phẩm' },
    { name: 'Admin Orders', description: 'Quản lý đơn hàng, đổi trạng thái thanh toán & gán số Serial' },
    { name: 'Admin Inventory & Serials', description: 'Quản lý kho hàng: Nhà cung cấp, phiếu nhập kho, quản lý mã Serial/IMEI' },
    { name: 'Admin Invoices', description: 'Quản lý hóa đơn VAT, xuất PDF và gửi lại email' },
    { name: 'Admin Banners & Brands', description: 'Quản lý nhãn hàng và hình ảnh Banner quảng cáo' },
    { name: 'Admin Settings', description: 'Thay đổi tham số cấu hình cửa hàng' },
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
          400: { description: 'Thông tin đăng ký không hợp lệ hoặc email đã tồn tại' },
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
            description: 'Đăng nhập thành công',
            headers: {
              'Set-Cookie': { schema: { type: 'string', example: 'access_token=...; Path=/; HttpOnly; Secure; SameSite=Lax' } }
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
          401: { description: 'Email hoặc mật khẩu không chính xác' },
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
            description: 'Đăng xuất thành công',
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
            description: 'Làm mới token thành công',
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
          401: { description: 'Token hết hạn hoặc không hợp lệ' },
        },
      },
    },
    '/api/auth/verify-email': {
      get: {
        tags: ['Authentication'],
        summary: 'Xác minh Email qua Token',
        description: 'Đường dẫn xác minh khi người dùng ấn vào liên kết trong email gửi về.',
        parameters: [
          { name: 'token', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Xác minh email thành công' },
          400: { description: 'Mã xác minh không hợp lệ hoặc đã hết hạn' }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Yêu cầu đặt lại mật khẩu',
        description: 'Gửi link reset mật khẩu đến email đã đăng ký.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } }, required: ['email'] } } }
        },
        responses: {
          200: { description: 'Đã gửi email hướng dẫn' }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Đặt lại mật khẩu mới',
        description: 'Cập nhật mật khẩu mới bằng token nhận từ email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string' }
                },
                required: ['token', 'newPassword']
              }
            }
          }
        },
        responses: {
          200: { description: 'Đặt lại mật khẩu thành công' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Lấy thông tin tài khoản hiện tại',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lấy thông tin tài khoản thành công',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } } }
          },
          401: { description: 'Chưa đăng nhập' }
        },
      },
    },
    '/api/auth/send-verification-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Gửi lại email xác minh',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Đã gửi email xác minh' }
        }
      }
    },
    '/api/auth/change-password': {
      patch: {
        tags: ['Authentication'],
        summary: 'Đổi mật khẩu tài khoản',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                  confirmPassword: { type: 'string' }
                },
                required: ['currentPassword', 'newPassword', 'confirmPassword']
              }
            }
          }
        },
        responses: {
          200: { description: 'Thay đổi mật khẩu thành công' }
        }
      }
    },

    // ─── USER PROFILE & ADDRESSES ─────────────────────────────────────────────
    '/api/users/me': {
      patch: {
        tags: ['User Profile & Addresses'],
        summary: 'Cập nhật thông tin cá nhân',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string', example: 'Nguyen Van B' } } } } }
        },
        responses: {
          200: { description: 'Cập nhật thành công' }
        }
      }
    },
    '/api/users/me/avatar': {
      post: {
        tags: ['User Profile & Addresses'],
        summary: 'Tải lên ảnh đại diện',
        description: 'Tải lên hình ảnh dạng multipart/form-data. Ảnh sẽ được tự động lưu lên Cloudinary.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: { type: 'string', format: 'binary', description: 'File ảnh JPEG/PNG' }
                },
                required: ['avatar']
              }
            }
          }
        },
        responses: {
          200: { description: 'Upload thành công' }
        }
      }
    },
    '/api/users/me/addresses': {
      get: {
        tags: ['User Profile & Addresses'],
        summary: 'Lấy danh sách sổ địa chỉ',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lấy sổ địa chỉ thành công',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, addresses: { type: 'array', items: { $ref: '#/components/schemas/Address' } } } } } }
          }
        }
      },
      post: {
        tags: ['User Profile & Addresses'],
        summary: 'Thêm địa chỉ nhận hàng mới',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  receiverName: { type: 'string', example: 'Nguyen Van A' },
                  receiverPhone: { type: 'string', example: '0901234567' },
                  province: { type: 'string', example: 'TP Hồ Chí Minh' },
                  district: { type: 'string', example: 'Quận 1' },
                  ward: { type: 'string', example: 'Phường Bến Nghé' },
                  detailAddress: { type: 'string', example: '120 Lê Lợi' },
                  isDefault: { type: 'boolean', example: false }
                },
                required: ['receiverName', 'receiverPhone', 'province', 'district', 'ward', 'detailAddress']
              }
            }
          }
        },
        responses: {
          201: { description: 'Tạo địa chỉ thành công' }
        }
      }
    },
    '/api/users/me/addresses/{id}': {
      patch: {
        tags: ['User Profile & Addresses'],
        summary: 'Chỉnh sửa địa chỉ nhận hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  receiverName: { type: 'string' },
                  receiverPhone: { type: 'string' },
                  province: { type: 'string' },
                  district: { type: 'string' },
                  ward: { type: 'string' },
                  detailAddress: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Cập nhật địa chỉ thành công' }
        }
      },
      delete: {
        tags: ['User Profile & Addresses'],
        summary: 'Xóa một địa chỉ nhận hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã xóa thành công' }
        }
      }
    },
    '/api/users/me/addresses/{id}/default': {
      patch: {
        tags: ['User Profile & Addresses'],
        summary: 'Thiết lập làm địa chỉ mặc định',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã đặt làm địa chỉ mặc định' }
        }
      }
    },

    // ─── PRODUCTS ─────────────────────────────────────────────────────────────
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Lấy danh sách sản phẩm',
        description: 'Lọc, sắp xếp, phân trang và tìm kiếm sản phẩm.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'brandId', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['price', 'createdAt', 'rating'], default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: {
            description: 'Thành công',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, products: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } }
          }
        }
      }
    },
    '/api/products/brands': {
      get: {
        tags: ['Products'],
        summary: 'Lấy danh sách thương hiệu theo loại',
        parameters: [{ name: 'stockType', in: 'query', required: false, schema: { type: 'string', enum: ['SIMPLE', 'SERIAL'] } }],
        responses: {
          200: { description: 'Lấy thành công' }
        }
      }
    },
    '/api/products/by-slug/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Lấy chi tiết sản phẩm theo Slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tìm thấy sản phẩm' },
          404: { description: 'Không tìm thấy sản phẩm' }
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Lấy chi tiết sản phẩm theo ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tìm thấy sản phẩm' }
        }
      }
    },

    // ─── CART ─────────────────────────────────────────────────────────────────
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Lấy thông tin giỏ hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Xóa sạch toàn bộ giỏ hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Giỏ hàng đã được làm trống' }
        }
      }
    },
    '/api/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Thêm sản phẩm/biến thể vào giỏ',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  productVariantId: { type: 'string', nullable: true },
                  quantity: { type: 'integer', default: 1 }
                },
                required: ['productId', 'quantity']
              }
            }
          }
        },
        responses: {
          200: { description: 'Đã thêm thành công' }
        }
      }
    },
    '/api/cart/items/{productId}': {
      put: {
        tags: ['Cart'],
        summary: 'Cập nhật số lượng sản phẩm trong giỏ',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'variantId', in: 'query', required: false, schema: { type: 'string' }, description: 'Cần thiết nếu sản phẩm có biến thể' }
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer', minimum: 1 } }, required: ['quantity'] } } }
        },
        responses: {
          200: { description: 'Cập nhật thành công' }
        }
      },
      delete: {
        tags: ['Cart'],
        summary: 'Xóa một sản phẩm khỏi giỏ hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'variantId', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Đã xóa khỏi giỏ hàng' }
        }
      }
    },

    // ─── ORDERS ───────────────────────────────────────────────────────────────
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Đặt hàng mới',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shippingAddress: { type: 'string' },
                  shippingPhone: { type: 'string' },
                  paymentMethod: { type: 'string', enum: ['STRIPE', 'SEPAY'] },
                  couponCode: { type: 'string', nullable: true }
                },
                required: ['shippingAddress', 'shippingPhone', 'paymentMethod']
              }
            }
          }
        },
        responses: {
          201: { description: 'Đặt hàng thành công' }
        }
      },
      get: {
        tags: ['Orders'],
        summary: 'Xem danh sách đơn hàng đã mua',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Xem chi tiết một đơn hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã tìm thấy đơn hàng' }
        }
      }
    },
    '/api/orders/{id}/cancel': {
      patch: {
        tags: ['Orders'],
        summary: 'Hủy đơn hàng',
        description: 'Chỉ cho phép hủy khi đơn hàng đang ở trạng thái PENDING.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Hủy đơn hàng thành công' }
        }
      }
    },

    // ─── PAYMENTS ─────────────────────────────────────────────────────────────
    '/api/payments/intent/{orderId}': {
      post: {
        tags: ['Orders'],
        summary: 'Khởi tạo cổng thanh toán Stripe',
        description: 'Tạo Payment Intent từ Stripe cho một đơn hàng cụ thể.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Khởi tạo thành công', content: { 'application/json': { schema: { type: 'object', properties: { clientSecret: { type: 'string' } } } } } }
        }
      }
    },
    '/api/payments/status/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Kiểm tra trạng thái thanh toán',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/payments/sepay/{orderId}': {
      post: {
        tags: ['Orders'],
        summary: 'Tạo liên kết thanh toán SePay (VietQR)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Thành công', content: { 'application/json': { schema: { type: 'object', properties: { checkoutUrl: { type: 'string' } } } } } }
        }
      }
    },
    '/api/payments/sepay/webhook': {
      post: {
        tags: ['Orders'],
        summary: 'Webhook xử lý IPN SePay',
        description: 'Webhook nhận cuộc gọi từ hệ thống SePay báo thanh toán ngân hàng chuyển khoản thành công.',
        responses: {
          200: { description: 'OK' }
        }
      }
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Orders'],
        summary: 'Webhook Stripe',
        description: 'Xử lý sự kiện `payment_intent.succeeded` từ Stripe.',
        responses: {
          200: { description: 'OK' }
        }
      }
    },

    // ─── REVIEWS ──────────────────────────────────────────────────────────────
    '/api/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Gửi đánh giá sản phẩm',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orderItemId: { type: 'string', description: 'ID của sản phẩm trong đơn hàng đã giao thành công' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: 'Sản phẩm dùng tốt, đóng gói cẩn thận!' }
                },
                required: ['orderItemId', 'rating']
              }
            }
          }
        },
        responses: {
          201: { description: 'Đã tạo đánh giá thành công' }
        }
      }
    },

    // ─── FAVORITES ────────────────────────────────────────────────────────────
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Xem danh sách yêu thích',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/favorites/{productId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Thêm/Xóa sản phẩm yêu thích (Toggle)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã chuyển đổi trạng thái yêu thích thành công' }
        }
      }
    },

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
    '/api/notifications/auth': {
      post: {
        tags: ['Notifications'],
        summary: 'Xác thực Pusher/Soketi cho kênh riêng tư',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { socket_id: { type: 'string' }, channel_name: { type: 'string' } }, required: ['socket_id', 'channel_name'] } } }
        },
        responses: {
          200: { description: 'Xác thực thành công' }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Lấy danh sách thông báo cá nhân',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Lấy số lượng thông báo chưa đọc',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } } }
        }
      }
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Đánh dấu một thông báo là đã đọc',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Đánh dấu tất cả thông báo là đã đọc',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Đã đọc hết' }
        }
      }
    },

    // ─── COUPONS ──────────────────────────────────────────────────────────────
    '/api/coupons/validate': {
      post: {
        tags: ['Coupons'],
        summary: 'Kiểm tra và áp dụng mã giảm giá',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'NEWTECH2026' },
                  orderAmount: { type: 'number', example: 500.00 }
                },
                required: ['code', 'orderAmount']
              }
            }
          }
        },
        responses: {
          200: { description: 'Mã hợp lệ', content: { 'application/json': { schema: { type: 'object', properties: { discountAmount: { type: 'number' } } } } } },
          400: { description: 'Mã không hợp lệ hoặc không đủ điều kiện' }
        }
      }
    },

    // ─── CATEGORIES & TAGS ────────────────────────────────────────────────────
    '/api/categories': {
      get: {
        tags: ['Categories & Tags'],
        summary: 'Lấy tất cả danh mục sản phẩm',
        responses: {
          200: { description: 'Thành công' }
        }
      },
      post: {
        tags: ['Categories & Tags'],
        summary: 'Tạo danh mục mới (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] } } }
        },
        responses: {
          201: { description: 'Tạo thành công' }
        }
      }
    },
    '/api/categories/{id}': {
      patch: {
        tags: ['Categories & Tags'],
        summary: 'Cập nhật thông tin danh mục (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } }
        },
        responses: {
          200: { description: 'Cập nhật thành công' }
        }
      },
      delete: {
        tags: ['Categories & Tags'],
        summary: 'Xóa một danh mục (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã xóa thành công' }
        }
      }
    },
    '/api/tags': {
      get: {
        tags: ['Categories & Tags'],
        summary: 'Lấy tất cả các thẻ Tag',
        responses: {
          200: { description: 'Thành công' }
        }
      },
      post: {
        tags: ['Categories & Tags'],
        summary: 'Tạo thẻ Tag mới (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } } }
        },
        responses: {
          201: { description: 'Tạo thẻ thành công' }
        }
      }
    },
    '/api/tags/{id}': {
      delete: {
        tags: ['Categories & Tags'],
        summary: 'Xóa một thẻ Tag (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Đã xóa thẻ' }
        }
      }
    },

    // ─── POSTS ────────────────────────────────────────────────────────────────
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Lấy danh sách các bài đăng blog công nghệ',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }
        ],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/posts/by-slug/{slug}': {
      get: {
        tags: ['Posts'],
        summary: 'Xem chi tiết bài viết blog theo Slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tìm thấy bài viết' }
        }
      }
    },

    // ─── AI CHAT ──────────────────────────────────────────────────────────────
    '/api/ai-chat/send': {
      post: {
        tags: ['AI Chat'],
        summary: 'Gửi câu hỏi lên trợ lý AI (Người dùng đã đăng nhập)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } } }
        },
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/ai-chat/send-guest': {
      post: {
        tags: ['AI Chat'],
        summary: 'Gửi câu hỏi lên trợ lý AI (Khách vãng lai)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } } }
        },
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/ai-chat/history': {
      get: {
        tags: ['AI Chat'],
        summary: 'Lấy lịch sử hội thoại AI',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      },
      delete: {
        tags: ['AI Chat'],
        summary: 'Xóa toàn bộ lịch sử trò chuyện với AI',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Đã xóa thành công lịch sử' }
        }
      }
    },

    // ─── ADMIN GENERAL ────────────────────────────────────────────────────────
    '/api/admin/stats/dashboard': {
      get: {
        tags: ['Admin General'],
        summary: 'Báo cáo thống kê tổng quan (Dashboard)',
        description: 'Trả về doanh thu, tổng số đơn hàng, tổng số khách hàng và biểu đồ tăng trưởng.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin General'],
        summary: 'Danh sách tài khoản người dùng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/admin/users/{id}/role': {
      patch: {
        tags: ['Admin General'],
        summary: 'Thay đổi chức vụ của tài khoản (USER/ADMIN)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { role: { type: 'string', enum: ['USER', 'ADMIN'] } }, required: ['role'] } } }
        },
        responses: {
          200: { description: 'Thay đổi chức vụ thành công' }
        }
      }
    },
    '/api/admin/products': {
      get: {
        tags: ['Admin General'],
        summary: 'Lấy danh sách sản phẩm quản trị (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Thành công' }
        }
      },
      post: {
        tags: ['Admin General'],
        summary: 'Tạo sản phẩm mới',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  categoryId: { type: 'string' },
                  brandId: { type: 'string' },
                  price: { type: 'number' },
                  originalPrice: { type: 'number', nullable: true },
                  summary: { type: 'string' },
                  description: { type: 'string' },
                  stockType: { type: 'string', enum: ['SIMPLE', 'SERIAL'] },
                  stockCount: { type: 'integer' }
                },
                required: ['name', 'categoryId', 'brandId', 'price', 'stockType']
              }
            }
          }
        },
        responses: {
          201: { description: 'Tạo sản phẩm thành công' }
        }
      }
    },
    '/api/admin/products/{id}': {
      put: {
        tags: ['Admin General'],
        summary: 'Cập nhật thông tin sản phẩm',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          200: { description: 'Cập nhật thành công' }
        }
      },
      delete: {
        tags: ['Admin General'],
        summary: 'Xóa bỏ sản phẩm',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Xóa sản phẩm thành công' }
        }
      }
    },

    // ─── ADMIN ORDERS ─────────────────────────────────────────────────────────
    '/api/admin/orders': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Lấy tất cả đơn đặt hàng trong hệ thống',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'orderStatus', in: 'query', schema: { type: 'string' } },
          { name: 'paymentStatus', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/admin/orders/{id}': {
      get: {
        tags: ['Admin Orders'],
        summary: 'Xem chi tiết đơn hàng (Admin)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Thành công' }
        }
      }
    },
    '/api/admin/orders/{id}/status': {
      patch: {
        tags: ['Admin Orders'],
        summary: 'Cập nhật trạng thái đơn đặt hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { orderStatus: { type: 'string', enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] } }, required: ['orderStatus'] } } }
        },
        responses: {
          200: { description: 'Đổi trạng thái thành công' }
        }
      }
    },
    '/api/admin/orders/{id}/payment': {
      patch: {
        tags: ['Admin Orders'],
        summary: 'Cập nhật trạng thái thanh toán thủ công',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { paymentStatus: { type: 'string', enum: ['PENDING_PAYMENT', 'PAID', 'REFUNDED', 'FAILED'] } }, required: ['paymentStatus'] } } }
        },
        responses: {
          200: { description: 'Cập nhật thành công' }
        }
      }
    },
    '/api/admin/orders/{id}/assign-serial': {
      post: {
        tags: ['Admin Orders'],
        summary: 'Gán số Serial/IMEI thủ công cho một món hàng trong đơn',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  orderItemId: { type: 'string' },
                  serialUnitId: { type: 'string' }
                },
                required: ['orderItemId', 'serialUnitId']
              }
            }
          }
        },
        responses: {
          200: { description: 'Gán mã Serial thành công' }
        }
      }
    },
    '/api/admin/orders/{id}/note': {
      patch: {
        tags: ['Admin Orders'],
        summary: 'Cập nhật ghi chú nội bộ của admin cho đơn hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  note: { type: 'string', example: 'Khách hàng yêu cầu giao trước 5h chiều' }
                },
                required: ['note']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cập nhật ghi chú đơn hàng thành công',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    order: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ─── ADMIN INVENTORY & SERIALS ────────────────────────────────────────────
    '/api/admin/suppliers': {
      get: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Lấy danh sách các nhà cung cấp',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      },
      post: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Tạo mới một nhà cung cấp',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Công ty TNHH Apple Việt Nam' },
                  contactName: { type: 'string', example: 'Nguyen Van B' },
                  phone: { type: 'string', example: '0909999999' },
                  email: { type: 'string', format: 'email' },
                  address: { type: 'string' }
                },
                required: ['name']
              }
            }
          }
        },
        responses: { 201: { description: 'Tạo thành công' } }
      }
    },
    '/api/admin/stock-imports': {
      get: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Xem các phiếu nhập kho',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      },
      post: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Tạo phiếu nhập kho mới',
        description: 'Tăng tồn kho sản phẩm. Đối với sản phẩm SERIAL, bắt buộc đính kèm mảng các chuỗi Serial nhập vào.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  supplierId: { type: 'string' },
                  importDate: { type: 'string', format: 'date-time' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productId: { type: 'string' },
                        productVariantId: { type: 'string', nullable: true },
                        quantity: { type: 'integer' },
                        purchasePrice: { type: 'number' },
                        serials: { type: 'array', items: { type: 'string' }, description: 'Mảng mã serial nếu mặt hàng quản lý theo serial' }
                      },
                      required: ['productId', 'quantity', 'purchasePrice']
                    }
                  }
                },
                required: ['supplierId', 'items']
              }
            }
          }
        },
        responses: { 201: { description: 'Nhập kho thành công' } }
      }
    },
    '/api/admin/serials': {
      get: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Danh sách tất cả mã số Serial/IMEI trong hệ thống',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['IN_STOCK', 'RESERVED', 'SOLD'] } }],
        responses: { 200: { description: 'Thành công' } }
      }
    },
    '/api/admin/serials/lookup': {
      get: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Truy cứu thông tin chi tiết một mã Serial',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'serialNumber', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Tìm thấy thông tin chi tiết' } }
      }
    },
    '/api/admin/serials/low-stock': {
      get: {
        tags: ['Admin Inventory & Serials'],
        summary: 'Cảnh báo sản phẩm sắp hết hàng trong kho',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      }
    },

    // ─── ADMIN INVOICES ───────────────────────────────────────────────────────
    '/api/admin/invoices/{invoiceId}': {
      get: {
        tags: ['Admin Invoices'],
        summary: 'Lấy chi tiết hóa đơn',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Thành công' } }
      }
    },
    '/api/admin/invoices/{invoiceId}/pdf': {
      get: {
        tags: ['Admin Invoices'],
        summary: 'Tải tệp PDF hóa đơn bán hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Tệp PDF hóa đơn', content: { 'application/pdf': {} } }
        }
      }
    },
    '/api/admin/invoices/{invoiceId}/resend': {
      post: {
        tags: ['Admin Invoices'],
        summary: 'Gửi lại email hóa đơn cho khách hàng',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Gửi thành công' } }
      }
    },
    '/api/admin/invoices/{invoiceId}/issue': {
      patch: {
        tags: ['Admin Invoices'],
        summary: 'Phát hành chính thức hóa đơn',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Đã phát hành thành công' } }
      }
    },
    '/api/admin/invoices/{invoiceId}/cancel': {
      patch: {
        tags: ['Admin Invoices'],
        summary: 'Hủy bỏ hóa đơn',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'invoiceId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Hủy hóa đơn thành công' } }
      }
    },

    // ─── ADMIN BANNERS & BRANDS ───────────────────────────────────────────────
    '/api/admin/banners': {
      get: {
        tags: ['Admin Banners & Brands'],
        summary: 'Xem danh sách toàn bộ các banner',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      },
      post: {
        tags: ['Admin Banners & Brands'],
        summary: 'Tạo một banner quảng cáo mới',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  imageUrl: { type: 'string' },
                  linkUrl: { type: 'string' },
                  position: { type: 'integer' }
                },
                required: ['title', 'imageUrl']
              }
            }
          }
        },
        responses: { 201: { description: 'Tạo thành công' } }
      }
    },
    '/api/admin/banners/{id}': {
      put: {
        tags: ['Admin Banners & Brands'],
        summary: 'Chỉnh sửa banner',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'Cập nhật thành công' } }
      },
      delete: {
        tags: ['Admin Banners & Brands'],
        summary: 'Xóa banner',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Xóa thành công' } }
      }
    },
    '/api/admin/banners/{id}/toggle': {
      patch: {
        tags: ['Admin Banners & Brands'],
        summary: 'Bật/Tắt hiển thị banner',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Thay đổi trạng thái thành công' } }
      }
    },
    '/api/admin/brands': {
      get: {
        tags: ['Admin Banners & Brands'],
        summary: 'Xem danh sách các thương hiệu',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      },
      post: {
        tags: ['Admin Banners & Brands'],
        summary: 'Tạo mới một thương hiệu',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, logoUrl: { type: 'string' } }, required: ['name'] } } }
        },
        responses: { 201: { description: 'Tạo thương hiệu thành công' } }
      }
    },

    // ─── ADMIN SETTINGS ───────────────────────────────────────────────────────
    '/api/admin/settings': {
      get: {
        tags: ['Admin Settings'],
        summary: 'Lấy cấu hình hệ thống hiện tại',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: 'Thành công' } }
      },
      patch: {
        tags: ['Admin Settings'],
        summary: 'Cập nhật cấu hình hệ thống',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shopName: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  lowStockAlertThreshold: { type: 'integer' }
                }
              }
            }
          }
        },
        responses: { 200: { description: 'Cấu hình đã được lưu' } }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'Tự động gửi kèm JWT (`access_token`) bằng Cookie.'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Header gửi kèm: `Authorization: Bearer <token>`'
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
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'addr-001' },
          receiverName: { type: 'string', example: 'Nguyen Van A' },
          receiverPhone: { type: 'string', example: '0901234567' },
          province: { type: 'string', example: 'TP Hồ Chí Minh' },
          district: { type: 'string', example: 'Quận 1' },
          ward: { type: 'string', example: 'Phường Bến Nghé' },
          detailAddress: { type: 'string', example: '120 Lê Lợi' },
          isDefault: { type: 'boolean', example: true }
        }
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'prod-001' },
          name: { type: 'string', example: 'iPhone 15 Pro Max 256GB' },
          slug: { type: 'string', example: 'iphone-15-pro-max-256gb' },
          price: { type: 'number', example: 1199.99 },
          originalPrice: { type: 'number', example: 1299.99, nullable: true },
          summary: { type: 'string', example: 'Điện thoại flagship Titan...' },
          stockType: { type: 'string', example: 'SIMPLE', enum: ['SIMPLE', 'SERIAL'] },
          stockCount: { type: 'integer', example: 25 },
          thumbnail: { type: 'string', example: 'https://cloudinary.com/image.jpg' },
          averageRating: { type: 'number', example: 4.8 },
          reviewCount: { type: 'integer', example: 120 }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ord-812042' },
          orderNumber: { type: 'string', example: 'NT-20260524-ABCDE' },
          totalAmount: { type: 'number', example: 2399.98 },
          shippingAddress: { type: 'string', example: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
          shippingPhone: { type: 'string', example: '0901234567' },
          paymentMethod: { type: 'string', example: 'SEPAY' },
          paymentStatus: { type: 'string', example: 'PENDING_PAYMENT' },
          orderStatus: { type: 'string', example: 'PENDING' },
          adminNote: { type: 'string', example: 'Khách hàng yêu cầu giao trước 5h chiều', nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

module.exports = openApiSpec;
