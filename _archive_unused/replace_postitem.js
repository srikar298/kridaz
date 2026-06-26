const fs = require('fs');

const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/features/networking/components/PostItem.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace post.adminId?.profilePicture || "/default-avatar.png"
content = content.replace(
  '<img\n              src={post.adminId?.profilePicture || "/default-avatar.png"}\n              className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[var(--primary)]/50 transition-colors"\n              alt=""\n            />',
  `{post.adminId?.profilePicture || post.adminId?.profileImage ? (
              <img
                src={post.adminId?.profilePicture || post.adminId?.profileImage}
                className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[var(--primary)]/50 transition-colors"
                alt=""
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:border-[var(--primary)]/50 flex items-center justify-center transition-colors">
                <span className="text-[#BFF367] font-bold text-sm">
                  {(post.adminId?.name || post.author?.name || "U").substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}`
);

// Replace user?.profilePicture || "/default-avatar.png"
content = content.replace(
  '<img\n                    src={user?.profilePicture || "/default-avatar.png"}\n                    className="w-8 h-8 rounded-full object-cover border border-white/10"\n                    alt=""\n                  />',
  `{user?.profilePicture || user?.profileImage ? (
                    <img
                      src={user?.profilePicture || user?.profileImage}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                      alt=""
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-[#BFF367] font-bold text-xs">
                        {(user?.name || user?.username || "U").substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}`
);

fs.writeFileSync(path, content);
console.log('PostItem profile images replaced successfully');
