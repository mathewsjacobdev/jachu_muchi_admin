const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const servicesDir = path.join(__dirname, 'src', 'api', 'services');

const pairs = [
  { page: 'UsersPage.tsx', service: 'managedUser.service.ts' },
  { page: 'TestimonialsPage.tsx', service: 'testimonial.service.ts' },
  { page: 'ProductsPage.tsx', service: 'course.service.ts' },
  { page: 'NewsPage.tsx', service: 'news.service.ts' },
  { page: 'GalleryPage.tsx', service: 'gallery.service.ts' },
  { page: 'CategoriesPage.tsx', service: 'category.service.ts' },
  { page: 'BranchesPage.tsx', service: 'branch.service.ts' },
  { page: 'AlumniPage.tsx', service: 'alumni.service.ts' },
];

function fixPage(file) {
  const p = path.join(pagesDir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  // Replace useState
  content = content.replace(/const\s+\[sortBy,\s*setSortBy\]\s*=\s*useState(?:<[^>]+>)?\("createdAt"\);/, 'const [dateFilter, setDateFilter] = useState("");');

  // Replace hasFilter condition
  content = content.replace(/sortBy\s*!==\s*"createdAt"/, 'dateFilter !== ""');

  // Add dateFilter to state and replace single variable usage iteratively
  // Instead of complex lookarounds, we'll replace exact known usages:
  content = content.split('sortBy,').join('dateFilter,');
  content = content.split(', sortBy]').join(', dateFilter]');
  content = content.split(' sortBy]').join(' dateFilter]');
  content = content.split(', sortBy,').join(', dateFilter,');
  content = content.split('[sortBy,').join('[dateFilter,');
  content = content.split('setSortBy').join('setDateFilter');
  content = content.split('sortBy !==').join('dateFilter !==');
  content = content.split('sortBy=').join('dateFilter=');
  content = content.split('sortBy !== "date"').join('dateFilter !== ""');

  // Replace the API payload `dateFilter,` with `date: dateFilter || undefined, \n order,`
  // Wait, different pages might have different indentations
  content = content.replace(/\s+dateFilter,(\s+order,)/, '\n              date: dateFilter || undefined,$1');

  // Sometimes order is at the end without a comma
  content = content.replace(/\s+dateFilter,(\s+order\s+)/, '\n              date: dateFilter || undefined,$1');

  // Replace Select block
  const selectRegex = /<Select\s+value={dateFilter}[\s\S]*?<\/Select>/g;
  const newDateInput = `<div className="w-full min-w-[140px]">
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

  content = content.replace(selectRegex, newDateInput);

  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed', file);
}

function fixService(file) {
  const p = path.join(servicesDir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  content = content.replace(/(sortBy\s*\??:\s*[^;]+;)/, 'date?: string;\n  $1');

  content = content.replace(/(if\s*\(\s*params\.sortBy.*?\s*q\.set\("sortBy".*?\n)/, 'if (params.date) q.set("date", params.date);\n  $1');
  content = content.replace(/(q\.set\("sortBy".*?\n)/, 'if (params.date) q.set("date", params.date);\n  $1');

  fs.writeFileSync(p, content, 'utf8');
  console.log('Fixed', file);
}

pairs.forEach(({ page, service }) => {
  fixPage(page);
  fixService(service);
});

console.log("All done!");
