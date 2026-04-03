import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

/**
 * attributes: [{ name: string, values: string[] }]
 * onChange: (next) => void
 */
export function AttributeManager({ attributes, onChange }) {
  const addAttribute = () => {
    onChange([...attributes, { name: '', values: [''] }]);
  };

  const removeAttribute = (idx) => {
    onChange(attributes.filter((_, i) => i !== idx));
  };

  const setAttrName = (idx, name) => {
    const next = [...attributes];
    next[idx] = { ...next[idx], name };
    onChange(next);
  };

  const addValue = (attrIdx) => {
    const next = [...attributes];
    next[attrIdx] = {
      ...next[attrIdx],
      values: [...next[attrIdx].values, ''],
    };
    onChange(next);
  };

  const setValue = (attrIdx, valIdx, value) => {
    const next = [...attributes];
    const vals = [...next[attrIdx].values];
    vals[valIdx] = value;
    next[attrIdx] = { ...next[attrIdx], values: vals };
    onChange(next);
  };

  const removeValue = (attrIdx, valIdx) => {
    const next = [...attributes];
    const vals = next[attrIdx].values.filter((_, i) => i !== valIdx);
    if (vals.length === 0) vals.push('');
    next[attrIdx] = { ...next[attrIdx], values: vals };
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Thuộc tính (Màu, Dung lượng, …)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
          <Plus className="mr-1 h-4 w-4" /> Thêm thuộc tính
        </Button>
      </div>

      {attributes.length === 0 && (
        <p className="text-sm text-muted-foreground">Chưa có thuộc tính. Thêm ít nhất một thuộc tính và các giá trị.</p>
      )}

      {attributes.map((attr, ai) => (
        <div key={ai} className="rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label>Tên thuộc tính</Label>
              <Input
                placeholder="Ví dụ: Màu sắc"
                value={attr.name}
                onChange={(e) => setAttrName(ai, e.target.value)}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeAttribute(ai)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Giá trị</Label>
            {attr.values.map((v, vi) => (
              <div key={vi} className="flex gap-2">
                <Input
                  placeholder="Ví dụ: Đen"
                  value={v}
                  onChange={(e) => setValue(ai, vi, e.target.value)}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => removeValue(ai, vi)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => addValue(ai)}>
              <Plus className="mr-1 h-3 w-3" /> Thêm giá trị
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
