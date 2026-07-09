import { useState } from "react";

export type UserRole = "reporter" | "organizer";

export type SessionUser = {
  name: string;
  role: UserRole;
};

const roleLabels: Record<UserRole, string> = {
  reporter: "回報與行動者",
  organizer: "資訊整理者",
};

export function labelForUserRole(role: UserRole) {
  return roleLabels[role];
}

export function LoginPanel({
  onLogin,
}: {
  onLogin: (user: SessionUser) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("organizer");

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin({
      name: name.trim() || "Demo 使用者",
      role,
    });
  }

  return (
    <main className="login-layout">
      <form className="login-panel" onSubmit={submitLogin}>
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>
          選擇你的協作角色後進入工作台。這是前端 demo
          登入，不會連接後端或保存真實帳號。
        </p>

        <label>
          名稱
          <input
            autoComplete="name"
            placeholder="例如：值班整理者"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <fieldset>
          <legend>角色</legend>
          <div className="role-options">
            {Object.entries(roleLabels).map(([value, label]) => (
              <label key={value}>
                <input
                  checked={role === value}
                  name="role"
                  type="radio"
                  value={value}
                  onChange={() => setRole(value as UserRole)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button className="button button--primary" type="submit">
          進入工作台
        </button>
      </form>
    </main>
  );
}
