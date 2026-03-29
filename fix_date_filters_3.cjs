const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const pages = [
  'UsersPage.tsx',
  'TestimonialsPage.tsx',
  'ProductsPage.tsx',
  'NewsPage.tsx',
  'GalleryPage.tsx',
  'CategoriesPage.tsx',
  'BranchesPage.tsx',
  'AlumniPage.tsx',
];

pages.forEach(file => {
  const p = path.join(pagesDir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  const selectRegex = /<Select[^>]*?value=\{sortBy\}[\s\S]*?<\/Select>/g;

  let newDateInput = `<div className="w-full min-w-[140px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setPage(1);
                  setDateFilter(e.target.value);
                }}
                className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 flex items-center text-sm text-white backdrop-blur-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>`;

  if (file === 'NewsPage.tsx') {
    newDateInput = `<div className="w-full sm:w-[150px]">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setPage(1);
                  setDateFilter(e.target.value);
                }}
                className="h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 flex items-center text-sm text-white backdrop-blur-lg hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>`;
  }

  content = content.replace(selectRegex, newDateInput);

  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed', file);
});

console.log("All done!");
