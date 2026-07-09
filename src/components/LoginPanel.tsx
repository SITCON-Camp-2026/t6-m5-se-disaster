import { useState } from "react";
import type { CaptchaChallenge } from "../backend/demo-backend";
import {
  getUserRoleEntries,
  type SessionUser,
  type UserRole,
} from "./user-role";

export function LoginPanel({
  onRequestCaptchaChallenge,
  onLogin,
}: {
  onRequestCaptchaChallenge: () => CaptchaChallenge;
  onLogin: (input: {
    name: string;
    role: UserRole;
    captchaId: string;
    captchaAnswer: string;
  }) => SessionUser;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("organizer");
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(() =>
    onRequestCaptchaChallenge(),
  );
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const canSubmit = captchaAnswer.trim().length > 0;

  function refreshCaptcha() {
    setCaptcha(onRequestCaptchaChallenge());
    setCaptchaAnswer("");
    setErrorMessage("");
  }

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      onLogin({
        name,
        role,
        captchaId: captcha.captchaId,
        captchaAnswer,
      });
    } catch {
      setErrorMessage("CAPTCHA 驗證不正確，請重新輸入。");
      setCaptcha(onRequestCaptchaChallenge());
      setCaptchaAnswer("");
    }
  }

  return (
    <main className="login-layout">
      <form className="login-panel" onSubmit={submitLogin}>
        <p className="eyebrow">SITCON Camp 2026</p>
        <h1>災害資訊整理工作台</h1>
        <p>選擇你的協作角色後進入工作台。登入會先由後端服務層驗證 CAPTCHA。</p>

        <label>
          名稱
          <input
            autoFocus
            autoComplete="name"
            placeholder="例如：值班整理者"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <fieldset>
          <legend>角色</legend>
          <div className="role-options">
            {getUserRoleEntries().map(([value, label]) => (
              <label key={value}>
                <input
                  checked={role === value}
                  name="role"
                  type="radio"
                  value={value}
                  onChange={() => setRole(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="captcha-field">
          <span className="captcha-box" aria-label="CAPTCHA 題目">
            {captcha.prompt}
            <strong>{captcha.demoAnswer}</strong>
          </span>
          <div className="captcha-field__label-row">
            <label htmlFor="captcha-answer">CAPTCHA 驗證</label>
            <button
              className="text-button"
              type="button"
              onClick={refreshCaptcha}
            >
              換一組
            </button>
          </div>
          <input
            autoComplete="off"
            id="captcha-answer"
            inputMode="numeric"
            placeholder="輸入 CAPTCHA 數字"
            value={captchaAnswer}
            onChange={(event) => setCaptchaAnswer(event.target.value)}
          />
        </div>

        {errorMessage ? (
          <p className="login-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <button
          className="button button--primary"
          type="submit"
          disabled={!canSubmit}
        >
          驗證並進入
        </button>
      </form>
    </main>
  );
}
