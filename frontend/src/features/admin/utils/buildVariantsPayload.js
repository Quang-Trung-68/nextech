import axiosInstance from '@/lib/axios';
import { cartesianProduct } from '@/features/admin/components/VariantGrid';

/**
 * Đồng bộ thuộc tính và biến thể lên server sau khi tạo/cập nhật sản phẩm.
 */
export async function buildVariantsPayload(productId, attributeDraft, variantRows, fallbackPrice) {
  const attrsPayload = {
    attributes: attributeDraft.map((a, i) => ({
      name: a.name.trim(),
      position: i,
      values: a.values
        .map((v) => String(v).trim())
        .filter(Boolean)
        .map((value, j) => ({ value, position: j })),
    })),
  };
  await axiosInstance.put(`/admin/products/${productId}/attributes`, attrsPayload);
  const { data: attrRes } = await axiosInstance.get(`/admin/products/${productId}/attributes`);
  const attrs = attrRes.data ?? attrRes;
  const sortedAttrs = [...attrs].sort((a, b) => a.position - b.position);
  const arrs = sortedAttrs.map((at) =>
    [...at.values].sort((p, q) => p.position - q.position).map((val) => val.value)
  );
  const combos = cartesianProduct(arrs);
  const variants = combos.map((combo, idx) => {
    const attributeValueIds = combo.map((val, i) => {
      const v = sortedAttrs[i].values.find((x) => x.value === val);
      return v?.id;
    });
    if (attributeValueIds.some((id) => !id)) {
      throw new Error('Không map được giá trị thuộc tính');
    }
    const row = variantRows[idx] || {};
    let imageUrl = row.imageUrl;
    if (imageUrl === '' || imageUrl === undefined) imageUrl = null;

    let salePrice = row.salePrice != null && row.salePrice !== '' ? Number(row.salePrice) : null;
    let saleExpiresAt =
      row.saleExpiresAt && String(row.saleExpiresAt).trim() !== ''
        ? new Date(row.saleExpiresAt).toISOString()
        : null;
    let saleStock =
      row.saleStock != null && row.saleStock !== '' ? parseInt(row.saleStock, 10) : null;
    if (salePrice == null || salePrice <= 0) {
      salePrice = null;
      saleExpiresAt = null;
      saleStock = null;
    }

    return {
      attributeValueIds,
      price: Number(row.price ?? fallbackPrice),
      stock: Number(row.stock ?? 0),
      imageUrl,
      salePrice,
      saleExpiresAt,
      saleStock,
    };
  });
  await axiosInstance.put(`/admin/products/${productId}/variants`, { variants });
}
