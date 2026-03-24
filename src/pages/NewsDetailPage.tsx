import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Image as ImageIcon, Loader2 } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { getNewsById } from "@/api/services/news.service";
import type { NewsItem } from "@/types";

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setArticle(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getNewsById(id)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setArticle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading article...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Article not found"
          description="This article may have been removed."
          action={(
            <Link
              to="/news"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-gray-200 transition-all duration-200 hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to News
            </Link>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="News Detail"
        description="Full article view"
        action={(
          <Button variant="outline" onClick={() => navigate("/news")}>
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Button>
        )}
      />

      <article className="overflow-hidden rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] shadow-xl">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="h-56 w-full object-cover sm:h-72"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-white/5 text-white/30 sm:h-72">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}

        <div className="space-y-4 p-5 sm:p-6 md:p-8">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{article.title}</h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300">
            <Calendar className="h-4 w-4" />
            {article.date}
          </div>
          <p className="whitespace-pre-wrap leading-7 text-gray-200">{article.description}</p>
        </div>
      </article>
    </div>
  );
};

export default NewsDetailPage;
