import { useMemo, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2 } from "lucide-react";

type GalleryCategory = "Campus" | "Labs" | "Events";

interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  image: string;
}

const initialGallery: GalleryItem[] = [
  { id: "1", title: "Main Building", category: "Campus", image: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop" },
  { id: "2", title: "Computer Lab", category: "Labs", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop" },
  { id: "3", title: "Annual Fest", category: "Events", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop" },
];

const categories: Array<"All" | GalleryCategory> = ["All", "Campus", "Labs", "Events"];

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>(initialGallery);
  const [categoryFilter, setCategoryFilter] = useState<"All" | GalleryCategory>("All");

  const filteredItems = useMemo(
    () => items.filter((item) => categoryFilter === "All" || item.category === categoryFilter),
    [items, categoryFilter],
  );

  const handleUploadMock = () => {
    setItems((prev) => [
      {
        id: Date.now().toString(),
        title: "New Upload",
        category: "Campus",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gallery Management"
        description={`${items.length} media items`}
        action={(
          <Button onClick={handleUploadMock} size="sm">
            <ImagePlus className="mr-1 h-4 w-4" />
            Upload Image
          </Button>
        )}
      />

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl sm:p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                categoryFilter === category ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 text-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
            <div className="space-y-2 p-3 sm:p-4 md:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white/90">{item.title}</p>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-400">
                  {item.category}
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
                  className="rounded-lg p-2 text-red-400 transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;
