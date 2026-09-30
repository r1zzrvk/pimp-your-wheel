import { LevelsScreen } from "@/components/levels-screen";
import { meta } from "@/components/meta";

export const metadata = meta({
  title: "Уровни",
  description: "Список уровней и наград за них",
});

export default function LevelsPage() {
  return <LevelsScreen />;
}
