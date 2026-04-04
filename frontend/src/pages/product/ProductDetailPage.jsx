import { useState, useMemo, useEffect } from "react";
import usePageTitle from "@/hooks/usePageTitle";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  SLUG_MAP,
  SLUG_LABEL_MAP,
  getProductTypeFromPath,
} from "@/constants/category";
import {
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Package,
  ArrowLeft,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { useProductBySlug } from "@/features/product/hooks/useProduct";
import { useAddToCart } from "@/features/cart/hooks/useCartMutations";
import { ProductGallery } from "@/features/product/components/ProductGallery";
import { ProductSpecsButton } from "@/features/product/components/ProductSpecsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND } from "@/utils/price";
import useAuthStore from "@/stores/useAuthStore";
import { toast } from "sonner";
import SaleCountdownBadge from "@/components/product/SaleCountdownBadge";
import SaleStockBadge from "@/components/product/SaleStockBadge";
import ProductReviews from "@/features/reviews/ProductReviews";
import { RelatedProducts } from "@/features/product/components/RelatedProducts";

function findVariantForSelection(variants, attributes, selection) {
  if (!variants?.length || !attributes?.length) return null;
  const required = attributes.map((a) => selection[a.id]).filter(Boolean);
  if (required.length !== attributes.length) return null;
  const need = new Set(required);
  return (
    variants.find((v) => {
      const ids = (v.values || []).map((x) => x.attributeValueId);
      return ids.length === required.length && ids.every((id) => need.has(id));
    }) || null
  );
}

/** Giá thực tế khách trả (API enrichVariantForStore). */
function getVariantPayablePrice(v) {
  if (!v) return 0;
  const fin = v.finalPrice != null ? Number(v.finalPrice) : null;
  if (fin != null && !Number.isNaN(fin)) return fin;
  return Number(v.price);
}

/** Có tồn tại biến thể chứa giá trị này đang được giảm giá không (gợi ý trên nút). */
function variantValueHasSaleLine(variants, valueId) {
  return variants.some((v) => {
    const ids = (v.values || []).map((x) => x.attributeValueId);
    if (!ids.includes(valueId)) return false;
    const pay = getVariantPayablePrice(v);
    const base = Number(v.price);
    return pay < base;
  });
}

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const productType = getProductTypeFromPath(location.pathname) || "phone";

  const { data: response, isLoading, isError } = useProductBySlug(slug);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [attrSelection, setAttrSelection] = useState({});

  useEffect(() => {
    setAttrSelection({});
    setQuantity(1);
  }, [slug]);

  const product = response?.product;
  usePageTitle(product?.name || "");

  const rawAttributes = product?.attributes ?? [];
  const variants = product?.variants ?? [];
  const hasVariants = Boolean(product?.hasVariants);
  const stock = product?.stock ?? 0;
  const images = product?.images;
  const finalPrice = product?.finalPrice;

  const attributes = useMemo(
    () => [...rawAttributes].sort((a, b) => a.position - b.position),
    [rawAttributes],
  );

  const variantPriceRange = useMemo(() => {
    if (!hasVariants || !variants.length) return null;
    const nums = variants.map((v) => Math.round(getVariantPayablePrice(v)));
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }, [hasVariants, variants]);

  const variantSingleEffectivePrice =
    variantPriceRange && variantPriceRange.min === variantPriceRange.max;

  const selectedVariant = useMemo(
    () => findVariantForSelection(variants, attributes, attrSelection),
    [variants, attributes, attrSelection],
  );

  const allOptionsSelected = useMemo(
    () =>
      hasVariants &&
      attributes.length > 0 &&
      attributes.every((a) => !!attrSelection[a.id]),
    [hasVariants, attributes, attrSelection],
  );

  useEffect(() => {
    if (!hasVariants || !selectedVariant) return;
    const max = Math.max(0, Number(selectedVariant.stock));
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, max)));
  }, [hasVariants, selectedVariant?.id, selectedVariant?.stock]);

  const displayFinalPrice = useMemo(() => {
    if (hasVariants && selectedVariant)
      return getVariantPayablePrice(selectedVariant);
    return finalPrice;
  }, [hasVariants, selectedVariant, finalPrice]);

  const selectedVariantOnSale = useMemo(() => {
    if (!hasVariants || !selectedVariant) return false;
    return (
      getVariantPayablePrice(selectedVariant) < Number(selectedVariant.price)
    );
  }, [hasVariants, selectedVariant]);

  const selectedVariantDiscountPct = useMemo(() => {
    if (!hasVariants || !selectedVariant || !selectedVariantOnSale) return 0;
    const base = Number(selectedVariant.price);
    const pay = getVariantPayablePrice(selectedVariant);
    if (base <= 0) return 0;
    return Math.round((1 - pay / base) * 100);
  }, [hasVariants, selectedVariant, selectedVariantOnSale]);

  const effectiveMaxQty = useMemo(() => {
    if (hasVariants) {
      if (allOptionsSelected && selectedVariant) {
        return Math.max(0, Number(selectedVariant.stock));
      }
      return 0;
    }
    return stock;
  }, [hasVariants, allOptionsSelected, selectedVariant, stock]);

  const isOutOfStock = useMemo(() => {
    if (hasVariants) {
      if (allOptionsSelected && selectedVariant) {
        return Number(selectedVariant.stock) === 0;
      }
      return false;
    }
    return stock === 0;
  }, [hasVariants, allOptionsSelected, selectedVariant, stock]);

  const cannotAddToCart = useMemo(() => {
    if (hasVariants) {
      return (
        !allOptionsSelected ||
        !selectedVariant ||
        Number(selectedVariant.stock) === 0
      );
    }
    return stock === 0;
  }, [hasVariants, allOptionsSelected, selectedVariant, stock]);

  const galleryImages = useMemo(() => {
    if (!selectedVariant?.imageUrl) return images;
    const dup = images?.some((img) => img.url === selectedVariant.imageUrl);
    if (dup) return images;
    return [
      { url: selectedVariant.imageUrl, publicId: "variant" },
      ...(images || []),
    ];
  }, [images, selectedVariant]);

  const categoryLabel = product?.category
    ? SLUG_LABEL_MAP[
        Object.keys(SLUG_MAP).find((k) => SLUG_MAP[k] === product.category)
      ] || product.category
    : "";
  const categoryLink = productType ? `/${productType}` : "/";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery Skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          {/* Detail Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Not found hoặc lỗi API
  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <Package className="w-16 h-16 text-muted-foreground opacity-50 block mb-2" />
        <h2 className="text-2xl font-bold tracking-tight">
          Không tìm thấy sản phẩm!
        </h2>
        <p className="text-muted-foreground w-80">
          Sản phẩm này có thể đã bị xóa hoặc không dồn tại trên hệ thống.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/" className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </Button>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    discountPercent,
    isNewArrival,
    manufactureYear,
    rating,
    numReviews,
    saleExpiresAt,
    isSaleActive,
    saleStock,
    saleRemaining,
    specsJson,
  } = product;

  // Xử lý tăng giảm số lượng input
  const handleQuantityChange = (type) => {
    if (type === "dec" && quantity > 1) {
      setQuantity((q) => q - 1);
    }
    if (type === "inc" && quantity < effectiveMaxQty) {
      setQuantity((q) => q + 1);
    }
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > effectiveMaxQty) val = effectiveMaxQty || 1;
    setQuantity(val);
  };

  // Submit giỏ hàng
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return navigate("/login", { state: { from: location } });
    }

    setIsBuyingNow(false);
    addToCart(
      {
        productId: product.id,
        quantity,
        ...(hasVariants && selectedVariant
          ? { variantId: selectedVariant.id }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Đã thêm sản phẩm vào giỏ hàng!");
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message ||
              "Có lỗi xảy ra khi thêm vào giỏ hàng",
          );
        },
      },
    );
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để mua hàng");
      return navigate("/login", { state: { from: location } });
    }

    setIsBuyingNow(true);
    addToCart(
      {
        productId: product.id,
        quantity,
        ...(hasVariants && selectedVariant
          ? { variantId: selectedVariant.id }
          : {}),
      },
      {
        onSuccess: () => {
          navigate("/checkout");
        },
        onError: (err) => {
          toast.error(
            err.response?.data?.message || "Có lỗi xảy ra khi mua hàng",
          );
          setIsBuyingNow(false);
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 pb-40 md:pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center text-[13px] text-apple-secondary mb-8 gap-2">
        <Link to="/" className="hover:text-apple-dark transition-colors">
          NexTech
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          to={categoryLink}
          className="hover:text-apple-dark transition-colors"
        >
          {categoryLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-apple-dark font-bold line-clamp-1">{name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* Gallery ảnh hiển thị */}
        <div className="md:sticky md:top-24 h-fit">
          <ProductGallery images={galleryImages} productName={name} />
        </div>

        {/* Thông tin sản phẩm chi tiết */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-2 text-muted-foreground text-sm uppercase font-semibold tracking-wider">
            {categoryLabel}
          </div>

          {product.brand?.slug && (
            <Link
              to={`/${productType}?brand=${product.brand.slug}`}
              className="inline-flex items-center gap-2 self-start"
            >
              <Badge
                variant="secondary"
                className="text-sm font-semibold px-3 py-1 rounded-full hover:bg-muted"
              >
                {product.brand.logo ? (
                  <img
                    src={product.brand.logo}
                    alt=""
                    className="h-5 w-5 object-contain rounded-sm"
                  />
                ) : null}
                {product.brand.name}
              </Badge>
            </Link>
          )}

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {name}
          </h1>

          {/* Badges dạng pill */}
          <div className="flex flex-wrap gap-2">
            {isNewArrival && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                ✨ Mới
              </span>
            )}
            {!hasVariants && discountPercent > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-600">
                -{discountPercent}% SALE
              </span>
            )}
            {hasVariants &&
              allOptionsSelected &&
              selectedVariantOnSale &&
              selectedVariantDiscountPct > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-600">
                  -{selectedVariantDiscountPct}% SALE
                </span>
              )}
            {hasVariants &&
              !allOptionsSelected &&
              variants.some(
                (v) => getVariantPayablePrice(v) < Number(v.price),
              ) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Đang giảm giá
                </span>
              )}
          </div>

          {/* Giá và Rating layout */}
          <div className="flex flex-wrap items-start gap-4 flex-col">
            {!hasVariants && isSaleActive && (saleExpiresAt || saleStock) ? (
              <div className="flex flex-row gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
                <SaleCountdownBadge
                  saleExpiresAt={saleExpiresAt}
                  isSaleActive={isSaleActive}
                />
                <SaleStockBadge
                  saleStock={saleStock}
                  saleRemaining={saleRemaining}
                  isSaleActive={isSaleActive}
                />
              </div>
            ) : null}

            {hasVariants &&
              isSaleActive &&
              (saleExpiresAt != null || saleStock != null) && (
                <div className="flex flex-row gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 w-full">
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    Flash sale
                  </span>
                  <SaleCountdownBadge
                    saleExpiresAt={saleExpiresAt}
                    isSaleActive={isSaleActive}
                  />
                  <SaleStockBadge
                    saleStock={saleStock}
                    saleRemaining={saleRemaining}
                    isSaleActive={isSaleActive}
                  />
                </div>
              )}

            {hasVariants ? (
              <div className="flex flex-col gap-1 min-h-[2.5rem]">
                {!allOptionsSelected && variantPriceRange && (
                  <span className="text-3xl font-bold text-primary tracking-tighter">
                    {variantSingleEffectivePrice
                      ? formatVND(variantPriceRange.min)
                      : `${formatVND(variantPriceRange.min)} – ${formatVND(variantPriceRange.max)}`}
                  </span>
                )}
                {allOptionsSelected &&
                  selectedVariant &&
                  selectedVariantOnSale && (
                    <div className="flex flex-col gap-1">
                      <span className="text-lg line-through text-gray-400">
                        {formatVND(Number(selectedVariant.price))}
                      </span>
                      <span className="text-3xl font-bold text-red-500 tracking-tighter">
                        {formatVND(displayFinalPrice)}
                      </span>
                      <span className="text-sm text-green-600 font-medium">
                        Tiết kiệm{" "}
                        {formatVND(
                          Number(selectedVariant.price) - displayFinalPrice,
                        )}{" "}
                        ({selectedVariantDiscountPct}%)
                      </span>
                      {selectedVariant.saleSource === "variant" &&
                        selectedVariant.saleExpiresAt != null &&
                        selectedVariant.isSaleActive && (
                          <div className="flex flex-wrap gap-2 items-center pt-1">
                            <SaleCountdownBadge
                              saleExpiresAt={selectedVariant.saleExpiresAt}
                              isSaleActive={selectedVariant.isSaleActive}
                            />
                            <SaleStockBadge
                              saleStock={selectedVariant.saleStock}
                              saleRemaining={selectedVariant.saleRemaining}
                              isSaleActive={selectedVariant.isSaleActive}
                            />
                          </div>
                        )}
                    </div>
                  )}
                {allOptionsSelected &&
                  selectedVariant &&
                  !selectedVariantOnSale && (
                    <span className="text-3xl font-bold text-primary tracking-tighter">
                      {formatVND(displayFinalPrice)}
                    </span>
                  )}
                {!allOptionsSelected && variantPriceRange && (
                  <span className="text-sm text-muted-foreground">
                    {variantSingleEffectivePrice
                      ? "Chọn đủ tùy chọn để xem tồn kho"
                      : "Chọn đủ tùy chọn để xem giá chính xác"}
                  </span>
                )}
              </div>
            ) : discountPercent > 0 &&
              Math.round(Number(price)) !== Math.round(Number(finalPrice)) ? (
              <div className="flex flex-col gap-1">
                <span className="text-lg line-through text-gray-400">
                  {formatVND(price)}
                </span>
                <span className="text-3xl font-bold text-red-500 tracking-tighter">
                  {formatVND(finalPrice)}
                </span>
                <span className="text-sm text-green-600 font-medium">
                  Tiết kiệm {formatVND(Number(price) - Number(finalPrice))} (
                  {discountPercent}%)
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary tracking-tighter">
                {formatVND(finalPrice)}
              </span>
            )}

            <div className="h-px w-full bg-border" />

            {/* Stars Review Box */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="ml-1.5 font-bold text-base leading-none pt-0.5">
                  {rating > 0 ? rating.toFixed(1) : 0}
                </span>
              </div>
              <span className="text-sm text-muted-foreground border-l pl-2">
                ({numReviews} đánh giá)
              </span>
            </div>

            <ProductSpecsButton specsJson={specsJson} productName={name} />
          </div>

          {/* Biến thể — chọn thuộc tính */}
          {hasVariants && attributes.length > 0 && (
            <div className="space-y-4">
              {attributes.map((attr) => (
                <div key={attr.id} className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    {attr.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...(attr.values || [])]
                      .sort((a, b) => a.position - b.position)
                      .map((val) => {
                        const selected = attrSelection[attr.id] === val.id;
                        const saleLine = variantValueHasSaleLine(
                          variants,
                          val.id,
                        );
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() =>
                              setAttrSelection((prev) => ({
                                ...prev,
                                [attr.id]: val.id,
                              }))
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                              selected
                                ? "border-apple-blue bg-apple-blue/10 text-apple-blue"
                                : "border-border bg-background hover:border-muted-foreground/30"
                            }`}
                          >
                            <span>{val.value}</span>
                            {saleLine && (
                              <span className="text-[10px] font-bold uppercase text-red-500">
                                Sale
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tồn Kho Status Badges + Năm ra mắt */}
          <div className="space-y-2">
            <div>
              {hasVariants ? (
                <>
                  {!allOptionsSelected && (
                    <Badge
                      variant="outline"
                      className="px-3 py-1 font-semibold tracking-wide"
                    >
                      Chọn đủ tùy chọn
                    </Badge>
                  )}
                  {allOptionsSelected &&
                    selectedVariant &&
                    Number(selectedVariant.stock) === 0 && (
                      <Badge
                        variant="destructive"
                        className="px-3 py-1 font-semibold tracking-wide"
                      >
                        HẾT HÀNG
                      </Badge>
                    )}
                  {allOptionsSelected &&
                    selectedVariant &&
                    Number(selectedVariant.stock) > 0 && (
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 hover:bg-green-200 border-none font-semibold"
                      >
                        Còn hàng
                      </Badge>
                    )}
                </>
              ) : isOutOfStock ? (
                <Badge
                  variant="destructive"
                  className="px-3 py-1 font-semibold tracking-wide"
                >
                  HẾT HÀNG
                </Badge>
              ) : stock <= 10 ? (
                <Badge className="bg-amber-500 hover:bg-amber-600 px-3 py-1 font-semibold tracking-wide border-transparent text-white">
                  CHỈ CÒN {stock} SẢN PHẨM
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 hover:bg-green-200 border-none font-semibold"
                >
                  CÒN HÀNG (Sẵn {stock})
                </Badge>
              )}
            </div>
            {/* Năm ra mắt */}
            {manufactureYear != null && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Năm ra mắt:</span>{" "}
                {manufactureYear}
              </p>
            )}
          </div>

          <hr className="bg-border my-2" />

          {/* Description text */}
          <div className="hidden md:block text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
          <details className="md:hidden group pb-4">
            <summary className="flex items-center justify-between text-apple-dark font-semibold cursor-pointer list-none py-2 text-base bg-white select-none">
              <span>Mô tả sản phẩm</span>
              <Plus className="w-5 h-5 text-apple-secondary group-open:hidden" />
              <Minus className="w-5 h-5 text-apple-blue hidden group-open:block" />
            </summary>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap pt-3 text-sm animate-in slide-in-from-top-2">
              {description}
            </div>
          </details>

          {/* Action Row Add To Cart */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-[#d2d2d7] z-50 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none md:pt-6 space-y-3 md:space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:shadow-none">
            <p className="font-medium text-sm hidden md:block">Số lượng</p>
            <div className="flex flex-row flex-wrap md:flex-wrap items-center gap-3 md:gap-4">
              {/* Stepper Số Lượng Input */}
              <div className="flex items-center w-32 md:w-36 h-12 bg-muted/50 rounded-xl p-1 border border-[#d2d2d7]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                  onClick={() => handleQuantityChange("dec")}
                  disabled={
                    cannotAddToCart || quantity <= 1 || effectiveMaxQty === 0
                  }
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <Input
                  type="number"
                  className="h-full border-0 bg-transparent text-center font-bold text-lg remove-arrow px-0 outline-none focus-visible:ring-0 shadow-none flex-1 font-mono"
                  value={quantity}
                  onChange={handleInputChange}
                  disabled={cannotAddToCart || effectiveMaxQty === 0}
                  min={1}
                  max={effectiveMaxQty || 1}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-full w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                  onClick={() => handleQuantityChange("inc")}
                  disabled={
                    cannotAddToCart ||
                    quantity >= effectiveMaxQty ||
                    effectiveMaxQty === 0
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Button Add To Cart */}
              <Button
                variant="outline"
                size="lg"
                className="flex-1 min-w-[140px] md:min-w-[160px] h-12 text-sm md:text-base font-semibold shadow-sm active:scale-[0.98] transition-all rounded-xl border-[#d2d2d7]"
                disabled={cannotAddToCart || isAddingToCart}
                title={
                  hasVariants && !allOptionsSelected
                    ? "Vui lòng chọn đầy đủ tùy chọn"
                    : hasVariants &&
                        selectedVariant &&
                        Number(selectedVariant.stock) === 0
                      ? "Hết hàng"
                      : undefined
                }
                onClick={handleAddToCart}
              >
                {isAddingToCart && !isBuyingNow ? (
                  "Đang thêm..."
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {cannotAddToCart
                      ? hasVariants && !allOptionsSelected
                        ? "Chọn tùy chọn"
                        : "Hết hàng"
                      : "Thêm vào giỏ"}
                  </>
                )}
              </Button>

              {/* Button Buy Now */}
              <Button
                size="lg"
                className="flex-1 min-w-[140px] md:min-w-[160px] h-12 text-sm md:text-base font-semibold shadow-md active:scale-[0.98] transition-all rounded-xl bg-apple-blue hover:bg-apple-blue/90"
                disabled={cannotAddToCart || isAddingToCart}
                title={
                  hasVariants && !allOptionsSelected
                    ? "Vui lòng chọn đầy đủ tùy chọn"
                    : hasVariants &&
                        selectedVariant &&
                        Number(selectedVariant.stock) === 0
                      ? "Hết hàng"
                      : undefined
                }
                onClick={handleBuyNow}
              >
                {isAddingToCart && isBuyingNow ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {cannotAddToCart
                      ? hasVariants && !allOptionsSelected
                        ? "Chọn tùy chọn"
                        : "Hết hàng"
                      : "Mua ngay"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Reviews Section ──────────────────────────────────────────────── */}
      <div className="mt-14 pt-10 border-t border-[#f5f5f7]">
        <ProductReviews productId={product.id} />
      </div>

      <RelatedProducts productId={product.id} />
    </div>
  );
};

export default ProductDetailPage;
