import { meta } from "@/components/meta";
import { ShopScreen } from "@/components/shop-screen";

export const metadata = meta({
  title: "Магазин",
  description: "Скины, анимации и всё для твоей коллекции.",
});

export default function ShopPage() {
  return <ShopScreen />;
}
