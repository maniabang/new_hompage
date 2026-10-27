"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Circle,
  Clapperboard,
  Copy,
  Download,
  Film,
  FolderOpen,
  History,
  Image as ImageIcon,
  Layers3,
  Loader2,
  LockKeyhole,
  LogOut,
  MoreHorizontal,
  Music2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  Asset,
  Cut,
  CutSummary,
  Episode,
  Version,
} from "@/lib/cutdesk/types";

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const d = await r
    .json()
    .catch(() => ({ error: "요청을 처리하지 못했습니다." }));
  if (!r.ok)
    throw new Error(d.error || "접속이 만료됐거나 요청을 처리하지 못했습니다.");
  return d;
}
function download(value: unknown, name: string) {
  const href = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  URL.revokeObjectURL(href);
}
function editable(c: Cut) {
  const {
    version,
    code,
    title,
    scene,
    status,
    duration,
    story,
    dialogue,
    prompt,
    work_prompt,
    prompt_draft,
    notes,
  } = c;
  return {
    version,
    code,
    title,
    scene,
    status,
    duration,
    story,
    dialogue,
    prompt,
    work_prompt,
    prompt_draft,
    notes,
    assets: c.assets.map(({ id, selected, note }) => ({ id, selected, note })),
  };
}
const date = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
function Mark() {
  return (
    <span className="brand-mark">
      <Clapperboard size={22} />
    </span>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span className="status" data-value={value}>
      <i />
      {value}
    </span>
  );
}

export function Workbench({ name }: { name: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [episode, setEpisode] = useState("EP01");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [cuts, setCuts] = useState<CutSummary[]>([]);
  const [project, setProject] = useState<{
    title: string;
    source_revision: number;
  } | null>(null);
  const [selected, setSelected] = useState("");
  const [cut, setCut] = useState<Cut | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [trash, setTrash] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCut, setNewCut] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [connected, setConnected] = useState(true);
  const refresh = () => setNonce((n) => n + 1);
  useEffect(() => {
    if (!name) return;
    const controller = new AbortController();
    api<{ project: typeof project; episodes: Episode[]; cuts: CutSummary[] }>(
      `/api/workspace?episode=${episode}&trash=${trash ? "1" : "0"}`,
      { signal: controller.signal },
    )
      .then((d) => {
        setProject(d.project);
        setEpisodes(d.episodes);
        setCuts(d.cuts);
        setConnected(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setMessage(e.message);
          setConnected(false);
        }
      });
    return () => controller.abort();
  }, [name, episode, trash, nonce]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    api<Cut>(`/api/cuts/${selected}`, { signal: controller.signal })
      .then((d) => {
        setCut(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setMessage(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [selected, nonce]);
  useEffect(() => {
    const h = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  const allow = () =>
    !dirty ||
    window.confirm(
      "저장하지 않은 변경이 있습니다. 이 화면에서 나가시겠습니까?",
    );
  const open = (id: string) => {
    if (id === selected || !allow()) return;
    setDirty(false);
    setCut(null);
    setSelected(id);
    setLoading(true);
  };
  const filtered = cuts.filter(
    (c) =>
      (filter === "전체" || c.status === filter) &&
      `${c.code} ${c.title} ${c.scene}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const total = episodes.reduce((n, e) => n + e.count, 0);
  const reviewed = episodes.reduce((n, e) => n + e.reviewed, 0);
  async function logout() {
    if (!allow()) return;
    await api("/api/session", { method: "DELETE" });
    router.refresh();
  }
  if (!name)
    return (
      <div className="login-shell">
        <div className="login-aside">
          <Mark />
          <span className="eyebrow">PRODUCTION WORKSPACE</span>
          <h1>
            하나의 컷에서,
            <br />
            하나의 완성본까지.
          </h1>
          <p>
            컷 번호, 참조 에셋, 프롬프트.
            <br />
            모든 작업을 같은 기준으로 연결합니다.
          </p>
          <div className="login-flow">
            <span>01 / CUT</span>
            <ChevronRight />
            <span>02 / ASSET</span>
            <ChevronRight />
            <span>03 / PROMPT</span>
          </div>
          <small>
            CUT DESK <span>PRIVATE COLLABORATION</span>
          </small>
        </div>
        <section className="login-panel">
          <div className="login-card">
            <span className="eyebrow">CUT DESK / ACCESS</span>
            <h2>제작 작업실에 접속</h2>
            <p>공유받은 접속 코드와 작업자 이름을 입력해주세요.</p>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setLoading(true);
                try {
                  await api("/api/session", {
                    method: "POST",
                    body: JSON.stringify({
                      name: form.get("name"),
                      password: form.get("password"),
                    }),
                  });
                  router.refresh();
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label>
                작업자 이름
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="이름을 입력하세요"
                  required
                  maxLength={40}
                />
              </label>
              <label>
                접속 코드
                <div className="input-icon">
                  <LockKeyhole size={16} />
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="공동 작업 접속 코드"
                    required
                  />
                </div>
              </label>
              {message && (
                <p role="alert" className="error">
                  {message}
                </p>
              )}
              <button className="primary" disabled={loading}>
                {loading ? (
                  <Loader2 className="spin" size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
                작업실 열기
              </button>
            </form>
            <div className="security-note">
              <ShieldCheck size={15} />
              작업 내용은 인증된 작업자에게만 공개됩니다.
            </div>
          </div>
        </section>
      </div>
    );
  return (
    <div className="desk">
      <aside className="rail">
        <Link className="rail-brand" href="/" aria-label="CUT DESK">
          <Mark />
        </Link>
        <button
          className={!trash ? "active" : ""}
          aria-label="컷 작업실"
          title="컷 작업실"
          onClick={() => {
            if (allow()) {
              setTrash(false);
              setDirty(false);
              setSelected("");
              setCut(null);
            }
          }}
        >
          <Layers3 />
        </button>
        <button
          className={trash ? "active" : ""}
          aria-label="휴지통"
          title="휴지통"
          onClick={() => {
            if (allow()) {
              setTrash(true);
              setDirty(false);
              setSelected("");
              setCut(null);
            }
          }}
        >
          <Trash2 />
        </button>
        <div className="rail-bottom">
          <span className="avatar" title={name}>
            {name.slice(0, 1)}
          </span>
          <button aria-label="로그아웃" title="로그아웃" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="desk-body">
        <header className="topbar">
          <div className="breadcrumbs">
            <strong>CUT DESK</strong>
            <span>/</span>
            <span>{project?.title || "제작 작업실"}</span>
            <ChevronRight size={12} />
            <b>{trash ? "휴지통" : "컷 · 에셋 · 프롬프트"}</b>
          </div>
          <div className="top-actions">
            <span className="cloud-status" data-connected={connected}>
              <i />
              {connected ? "클라우드 연결" : "연결 확인 필요"}
            </span>
            <button
              className="icon-button"
              onClick={refresh}
              disabled={dirty}
              title="최신 내용 불러오기"
              aria-label="새로고침"
            >
              <RefreshCw size={16} />
            </button>
            <details className="backup-menu">
              <summary className="button quiet">
                <Download size={15} />
                <span>백업</span>
                <ChevronDown size={12} />
              </summary>
              <div>
                <a href="/api/export">공동 작업 · 이력 백업</a>
                <a href="/api/source">이관 원본 JSON 보관본</a>
              </div>
            </details>
            <span className="user-name">{name}</span>
          </div>
        </header>
        <div className="overview">
          <div>
            <span className="eyebrow">PRODUCTION INDEX</span>
            <h1>
              {trash ? "삭제된 컷 보관함" : "컷 작업실"}
              <span>{String(total).padStart(3, "0")}</span>
            </h1>
            <p>원본의 맥락을 지키고, 에셋과 프롬프트를 정확하게 연결합니다.</p>
          </div>
          <div className="progress-overview">
            <span>
              <CheckCheck size={16} />
              검토 확정 <b>{reviewed}</b>
              <small>/ {total} CUTS</small>
            </span>
            <div>
              <i
                style={{ width: total ? `${(reviewed / total) * 100}%` : "0%" }}
              />
            </div>
            <small>모든 변경은 서버에 저장됩니다</small>
          </div>
        </div>
        {message && (
          <div className="notice" role="alert">
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="알림 닫기">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="workspace" data-detail={!!selected}>
          <section className="cut-library">
            <div className="library-top">
              <label className="episode-select">
                <Film size={16} />
                <select
                  aria-label="회차"
                  value={episode}
                  onChange={(e) => {
                    if (allow()) {
                      setEpisode(e.target.value);
                      setDirty(false);
                      setSelected("");
                      setCut(null);
                    }
                  }}
                >
                  {episodes.length ? (
                    episodes.map((e) => (
                      <option key={e.code} value={e.code}>
                        {e.code} · {e.title}
                      </option>
                    ))
                  ) : (
                    <option>EP01</option>
                  )}
                </select>
                <ChevronDown size={14} />
              </label>
              <button
                className="icon-button"
                aria-label="새 컷"
                title="새 컷 만들기"
                onClick={() => setNewCut(true)}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="searchbox">
              <Search size={15} />
              <input
                aria-label="컷 검색"
                placeholder="컷 번호, 장면 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>⌕</kbd>
            </div>
            <div className="list-filters">
              <select
                aria-label="상태 필터"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "전체",
                  "초안",
                  "검토",
                  "촬영 준비",
                  "작업 중",
                  "확정",
                  "보류",
                  "제외",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <span>{filtered.length}개 컷</span>
            </div>
            <div className="cut-list">
              {filtered.map((c, i) => (
                <button
                  className="cut-row"
                  key={c.id}
                  data-active={selected === c.id}
                  onClick={() => open(c.id)}
                >
                  <span className="cut-order">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="cut-info">
                    <span className="cut-code">{c.code}</span>
                    <strong>{c.title}</strong>
                    <span className="cut-row-meta">
                      <Status value={c.status} />
                      <span>{c.asset_count} ASSETS</span>
                      <span>{Number(c.duration).toFixed(1)}s</span>
                    </span>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {!filtered.length && (
                <div className="empty-small">
                  <FolderOpen />
                  <p>표시할 컷이 없습니다.</p>
                  <small>회차나 검색 조건을 확인해주세요.</small>
                </div>
              )}
            </div>
            <div className="library-foot">
              <span className="tiny-dot" />
              서버 저장 · 원본 r{project?.source_revision ?? "—"}
            </div>
          </section>
          <main className="editor-region">
            {loading ? (
              <div className="workspace-empty">
                <Loader2 className="spin" />
                <h2>컷 자료를 불러오고 있습니다</h2>
              </div>
            ) : cut ? (
              <CutEditor
                key={`${cut.id}-${cut.version}`}
                cut={cut}
                onDirty={setDirty}
                onSaved={(c) => {
                  setCut(c);
                  setDirty(false);
                  setMessage("서버에 저장했습니다.");
                  refresh();
                }}
                onClose={() => {
                  if (allow()) {
                    setSelected("");
                    setCut(null);
                    setDirty(false);
                  }
                }}
                onMessage={setMessage}
                onRefresh={refresh}
              />
            ) : (
              <div className="workspace-empty">
                <div className="empty-illustration">
                  <Clapperboard size={36} />
                  <span>01</span>
                  <span>02</span>
                  <span>03</span>
                </div>
                <span className="eyebrow">YOUR NEXT CUT STARTS HERE</span>
                <h2>작업할 컷을 선택해주세요</h2>
                <p>
                  왼쪽 목록에서 컷을 선택하면 프롬프트와
                  <br />
                  연결된 에셋을 함께 확인하고 편집할 수 있습니다.
                </p>
                <div className="empty-legend">
                  <span>
                    <Layers3 size={14} />
                    컷별 관리
                  </span>
                  <span>
                    <ImageIcon size={14} />
                    에셋 연결
                  </span>
                  <span>
                    <History size={14} />
                    변경 이력
                  </span>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      {newCut && (
        <Modal title="새 컷 만들기" close={() => setNewCut(false)}>
          <form
            className="dialog-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                const c = await api<{ id: string }>("/api/workspace", {
                  method: "POST",
                  body: JSON.stringify({
                    episode,
                    code: f.get("code"),
                    title: f.get("title"),
                  }),
                });
                setNewCut(false);
                refresh();
                open(c.id);
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            <label>
              컷 번호
              <input
                name="code"
                defaultValue={`${episode}_S01_C`}
                required
                placeholder={`${episode}_S01_C001`}
              />
            </label>
            <label>
              컷 이름
              <input name="title" required maxLength={200} />
            </label>
            <button className="primary">컷 만들기</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CutEditor({
  cut,
  onDirty,
  onSaved,
  onClose,
  onMessage,
  onRefresh,
}: {
  cut: Cut;
  onDirty: (v: boolean) => void;
  onSaved: (c: Cut) => void;
  onClose: () => void;
  onMessage: (s: string) => void;
  onRefresh: () => void;
}) {
  const [draft, setDraft] = useState(cut);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"prompt" | "work" | "brief" | "draft">(
    "prompt",
  );
  const [history, setHistory] = useState<Version[] | null>(null);
  const [library, setLibrary] = useState(false);
  const [preview, setPreview] = useState<Asset | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [recovery, setRecovery] = useState<Cut | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const dirty =
    JSON.stringify(editable(draft)) !== JSON.stringify(editable(cut));
  const change = useCallback(
    (fields: Partial<Cut>) => setDraft((d) => ({ ...d, ...fields })),
    [],
  );
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    try {
      localStorage.setItem(
        `cutdesk-draft-${cut.id}`,
        JSON.stringify({ baseVersion: cut.version, draft }),
      );
    } catch {}
  }, [dirty, cut.id, cut.version, draft]);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(`cutdesk-draft-${cut.id}`);
    } catch {}
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.draft) queueMicrotask(() => setRecovery(data.draft));
      } catch {}
    }
  }, [cut.id, cut.version]);
  const selected = draft.assets.filter((a) => a.selected);
  const text =
    tab === "draft"
      ? draft.prompt_draft
      : tab === "work"
        ? draft.work_prompt
        : draft.prompt;
  const references = useMemo(() => {
    const names = new Map<string, Asset[]>();
    for (const a of selected) {
      const n = a.name.trim().toLowerCase();
      names.set(n, [...(names.get(n) || []), a]);
    }
    const tokens = [
      ...text.matchAll(/@\{([^}]+)\}|@(Image|Audio|Video)\d+\b/gi),
    ].map((m) => ({ token: m[0], name: m[1]?.trim().toLowerCase() }));
    return tokens.map((t) => ({
      ...t,
      count: t.name ? names.get(t.name)?.length || 0 : 0,
    }));
  }, [selected, text]);
  const issues = references.filter((r) => r.count !== 1);
  async function save() {
    setSaving(true);
    try {
      const d = await api<Cut>(`/api/cuts/${cut.id}`, {
        method: "PUT",
        body: JSON.stringify(editable(draft)),
      });
      localStorage.removeItem(`cutdesk-draft-${cut.id}`);
      onSaved(d);
    } catch (e) {
      onMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      onMessage("프롬프트를 복사했습니다.");
    } catch {
      onMessage("텍스트를 선택해 복사해주세요.");
    }
  }
  const insert = (a: Asset) => {
    if (!a.selected) {
      onMessage("먼저 이 에셋을 사용으로 선택해주세요.");
      return;
    }
    const field =
      tab === "draft"
        ? "prompt_draft"
        : tab === "work"
          ? "work_prompt"
          : "prompt";
    const pos = promptRef.current?.selectionStart ?? draft[field].length;
    change({
      [field]:
        draft[field].slice(0, pos) + `@{${a.name}}` + draft[field].slice(pos),
    });
  };
  return (
    <>
      <div className="cut-heading">
        <div className="cut-heading-main">
          <button
            className="mobile-back icon-button"
            onClick={onClose}
            aria-label="컷 목록으로"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="cut-heading-code">{draft.code}</span>
          <ChevronRight size={14} />
          <h2>{draft.title}</h2>
        </div>
        <div className="cut-heading-actions">
          <Status value={draft.status} />
          <button
            className="icon-button"
            title="수정 이력"
            aria-label="수정 이력"
            onClick={async () => {
              try {
                setHistory(await api(`/api/cuts/${cut.id}/versions`));
              } catch (e) {
                onMessage((e as Error).message);
              }
            }}
          >
            <History size={17} />
          </button>
          <button
            className="icon-button"
            title="컷 정보 수정"
            aria-label="컷 정보 수정"
            onClick={() => setShowInfo(true)}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
      {recovery && (
        <div className="recovery">
          저장하지 않은 로컬 초안이 있습니다.
          <button
            onClick={() => {
              setDraft({ ...recovery, version: cut.version });
              setRecovery(null);
            }}
          >
            초안 이어서 편집
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(`cutdesk-draft-${cut.id}`);
              setRecovery(null);
            }}
          >
            닫기
          </button>
        </div>
      )}
      <div className="editor-columns">
        <section className="writing-pane">
          <div className="editor-tabs" role="tablist" aria-label="편집 영역">
            <button
              role="tab"
              aria-selected={tab === "prompt"}
              onClick={() => setTab("prompt")}
            >
              기본 프롬프트
            </button>
            <button
              role="tab"
              aria-selected={tab === "work"}
              onClick={() => setTab("work")}
            >
              작업 프롬프트
            </button>
            <button
              role="tab"
              aria-selected={tab === "draft"}
              onClick={() => setTab("draft")}
            >
              MCP 전달문
              <span className="tab-dot" />
            </button>
            <button
              role="tab"
              aria-selected={tab === "brief"}
              onClick={() => setTab("brief")}
            >
              줄콘티 · 대사
            </button>
          </div>
          <div className="writing-scroll">
            {tab === "brief" ? (
              <div className="brief-form">
                <label>
                  <span className="section-label">STORY / 줄콘티</span>
                  <textarea
                    value={draft.story}
                    onChange={(e) => change({ story: e.target.value })}
                    rows={10}
                  />
                </label>
                <label>
                  <span className="section-label">DIALOGUE / 대사</span>
                  <textarea
                    value={draft.dialogue}
                    onChange={(e) => change({ dialogue: e.target.value })}
                    rows={5}
                  />
                </label>
                <label>
                  <span className="section-label">NOTES / 작업 메모</span>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => change({ notes: e.target.value })}
                    rows={4}
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="section-toolbar">
                  <span className="section-label">
                    {tab === "draft"
                      ? "MCP HANDOFF / 작성 요청문"
                      : tab === "work"
                        ? "WORKING PROMPT / 작업 프롬프트"
                        : "BASE PROMPT / 기본 프롬프트"}
                  </span>
                  <button onClick={copy}>
                    <Copy size={14} />
                    복사
                  </button>
                </div>
                {tab === "draft" && (
                  <p className="field-hint">
                    기본 프롬프트와 별도로 보관되는 전달문입니다. 원문을
                    확인하고 편집해주세요.
                  </p>
                )}
                <textarea
                  className="prompt-input"
                  ref={promptRef}
                  aria-label={
                    tab === "draft"
                      ? "MCP 전달문"
                      : tab === "work"
                        ? "작업 프롬프트"
                        : "생성 프롬프트"
                  }
                  value={text}
                  onChange={(e) =>
                    change(
                      tab === "draft"
                        ? { prompt_draft: e.target.value }
                        : tab === "work"
                          ? { work_prompt: e.target.value }
                          : { prompt: e.target.value },
                    )
                  }
                  spellCheck={false}
                  placeholder="프롬프트를 작성하고 오른쪽 에셋의 태그를 삽입하세요."
                />
                <div className="prompt-check">
                  <div>
                    <ShieldCheck size={15} />
                    <strong>참조 태그 확인</strong>
                    <span>{references.length}개 태그</span>
                  </div>
                  {!references.length ? (
                    <p>파일명 태그를 삽입하면 선택한 에셋과 자동 대조합니다.</p>
                  ) : !issues.length ? (
                    <p className="good">
                      모든 파일명 태그가 선택한 에셋과 일치합니다.
                    </p>
                  ) : (
                    <>
                      <p>
                        연결을 확인할 태그 {issues.length}개 · 번호 태그는
                        파일명을 확인해주세요.
                      </p>
                      <div className="issue-tags">
                        {issues.map((r, i) => (
                          <span
                            key={i}
                            title={r.count > 1 ? "동명 파일" : "연결 미확인"}
                          >
                            {r.token}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
        <aside className="assets-pane">
          <header>
            <div>
              <span className="section-label">REFERENCE ASSETS</span>
              <h3>
                참조 에셋 <span>{selected.length}</span>
              </h3>
            </div>
            <button
              className="icon-button"
              aria-label="에셋 연결"
              title="에셋 연결"
              onClick={() => setLibrary(true)}
            >
              <Plus size={18} />
            </button>
          </header>
          <p className="assets-help">
            사용할 자료를 선택하고 태그로 연결하세요.
            <br />
            파일명과 경로를 함께 보관합니다.
          </p>
          <div className="asset-scroll">
            {draft.assets.map((a) => (
              <article
                className="asset-card"
                data-selected={a.selected}
                key={a.id}
              >
                <button
                  className="asset-preview"
                  onClick={() => setPreview(a)}
                  aria-label={`${a.name} 미리보기`}
                >
                  {a.preview && a.kind === "image" ? (
                    <img src={a.preview} alt={a.name} loading="lazy" />
                  ) : a.kind === "audio" ? (
                    <Music2 size={25} />
                  ) : a.kind === "video" ? (
                    <Film size={25} />
                  ) : (
                    <ImageIcon size={25} />
                  )}
                  <span>{a.kind.toUpperCase()}</span>
                </button>
                <div className="asset-meta">
                  <label className="asset-choice">
                    <input
                      type="checkbox"
                      checked={a.selected}
                      onChange={(e) =>
                        change({
                          assets: draft.assets.map((x) =>
                            x.id === a.id
                              ? { ...x, selected: e.target.checked }
                              : x,
                          ),
                        })
                      }
                    />
                    <strong title={a.name}>{a.name}</strong>
                  </label>
                  <small>{a.role || "참조 자료"}</small>
                  <button
                    className="tag-button"
                    onClick={() => insert(a)}
                    disabled={!a.selected}
                  >
                    @ 태그 삽입
                  </button>
                  <details>
                    <summary>경로 · 사용 메모</summary>
                    <p className="asset-path">{a.path}</p>
                    <textarea
                      aria-label={`${a.name} 사용 메모`}
                      value={a.note}
                      onChange={(e) =>
                        change({
                          assets: draft.assets.map((x) =>
                            x.id === a.id ? { ...x, note: e.target.value } : x,
                          ),
                        })
                      }
                      rows={3}
                    />
                    <button
                      className="text-button"
                      onClick={() =>
                        change({
                          assets: draft.assets.filter((x) => x.id !== a.id),
                        })
                      }
                    >
                      이 컷에서 연결 해제
                    </button>
                  </details>
                </div>
              </article>
            ))}
            {!draft.assets.length && (
              <div className="empty-small">
                <ImageIcon />
                <p>연결된 에셋이 없습니다.</p>
                <button className="button" onClick={() => setLibrary(true)}>
                  <Plus size={15} />
                  에셋 연결
                </button>
              </div>
            )}
          </div>
          <div className="asset-bottom">
            <FolderOpen size={14} />
            공용 에셋 보관함에서 관리
          </div>
        </aside>
      </div>
      <footer className="savebar">
        <div>
          <span className="save-state" data-dirty={dirty}>
            {saving ? (
              <Loader2 size={14} className="spin" />
            ) : dirty ? (
              <Circle size={10} />
            ) : (
              <Check size={15} />
            )}
            <b>
              {saving
                ? "서버에 저장 중"
                : dirty
                  ? "저장하지 않은 변경"
                  : "서버 저장 완료"}
            </b>
          </span>
          <small>
            v{cut.version} · {cut.updated_by} · {date(cut.updated_at)}
          </small>
        </div>
        <div>
          <button
            className="button quiet"
            onClick={() => download(draft, `${draft.code}-draft.json`)}
            title="이 컷의 편집 내용을 JSON으로 보관"
          >
            <Download size={15} />
            <span>초안 보관</span>
          </button>
          <button
            className="primary"
            disabled={!dirty || saving || !!cut.deleted_at}
            onClick={save}
          >
            <Check size={16} />
            {saving ? "저장 중…" : "변경 저장"}
          </button>
        </div>
      </footer>
      {library && (
        <AssetLibrary
          close={() => setLibrary(false)}
          onMessage={onMessage}
          onSelect={(a) => {
            if (!draft.assets.some((x) => x.id === a.id))
              change({ assets: [...draft.assets, a] });
            setLibrary(false);
          }}
        />
      )}
      {preview && (
        <Modal title={preview.name} close={() => setPreview(null)}>
          <div className="media-view">
            {preview.preview ? (
              preview.kind === "image" ? (
                <img src={preview.preview} alt={preview.name} />
              ) : preview.kind === "audio" ? (
                <audio src={preview.preview} controls />
              ) : (
                <video src={preview.preview} controls playsInline />
              )
            ) : (
              <div className="empty-small">
                <ImageIcon />
                <p>미디어 파일이 아직 업로드되지 않았습니다.</p>
                <p>에셋 경로를 확인하거나 이 파일을 업로드해주세요.</p>
              </div>
            )}
          </div>
          <p className="asset-path">{preview.path}</p>
          <details className="asset-edit-details">
            <summary>공용 에셋 정보 수정</summary>
            <p className="field-hint">
              이 에셋이 연결된 모든 컷에 적용됩니다. 이름 변경 시 프롬프트
              태그도 확인해주세요.
            </p>
            <form
              className="dialog-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const next = {
                  name: String(f.get("name")),
                  path: String(f.get("path")),
                  role: String(f.get("role")),
                };
                try {
                  await api(`/api/assets/${preview.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      before: {
                        name: preview.name,
                        path: preview.path,
                        role: preview.role,
                      },
                      next,
                    }),
                  });
                  const updated = { ...preview, ...next };
                  change({
                    assets: draft.assets.map((a) =>
                      a.id === preview.id ? updated : a,
                    ),
                  });
                  setPreview(updated);
                  onMessage(
                    "공용 에셋 정보를 저장했습니다. 참조 태그의 파일명도 확인해주세요.",
                  );
                } catch (e) {
                  onMessage((e as Error).message);
                }
              }}
            >
              <label>
                원본 파일명
                <input
                  name="name"
                  defaultValue={preview.name}
                  required
                  maxLength={300}
                />
              </label>
              <label>
                원본 경로
                <input
                  name="path"
                  defaultValue={preview.path}
                  required
                  maxLength={2000}
                />
              </label>
              <label>
                역할
                <input
                  name="role"
                  defaultValue={preview.role}
                  maxLength={100}
                />
              </label>
              <button className="button" type="submit">
                에셋 정보 저장
              </button>
            </form>
          </details>
          <label className="button upload-button">
            <Upload size={15} />
            미디어 업로드
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,audio/*,video/mp4,video/quicktime,video/webm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  onMessage("파일을 업로드하고 있습니다.");
                  const p = await api<{ url: string; key: string }>(
                    `/api/assets/${preview.id}/upload`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        name: file.name,
                        mime: file.type,
                        bytes: file.size,
                      }),
                    },
                  );
                  const r = await fetch(p.url, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                  });
                  if (!r.ok) throw new Error("파일 업로드에 실패했습니다.");
                  await api(`/api/assets/${preview.id}/upload`, {
                    method: "PUT",
                    body: JSON.stringify({ key: p.key }),
                  });
                  setPreview(null);
                  onMessage(
                    "파일을 저장했습니다. 저장하지 않은 내용이 있으면 먼저 변경 저장 후 새로고침해주세요.",
                  );
                } catch (e) {
                  onMessage((e as Error).message);
                }
              }}
            />
          </label>
        </Modal>
      )}
      {history && (
        <Modal title="수정 이력" close={() => setHistory(null)}>
          <p className="field-hint">
            이전 내용은 새 초안으로 가져온 뒤 확인하고 저장할 수 있습니다.
          </p>
          <div className="history-list">
            {history.map((v) => (
              <details key={v.id}>
                <summary>
                  <span>
                    v{v.version} <b>{v.action}</b>
                  </span>
                  <small>
                    {v.actor} · {date(v.created_at)}
                  </small>
                </summary>
                <pre>{v.snapshot.prompt || "프롬프트 없음"}</pre>
                <button
                  className="button"
                  onClick={() => {
                    const snapshot = v.snapshot;
                    const byId = new Map(draft.assets.map((a) => [a.id, a]));
                    const assets = (snapshot.assets || draft.assets)
                      .map((a) => ({ ...byId.get(a.id), ...a }))
                      .filter((a) => a.name) as Asset[];
                    setDraft({
                      ...draft,
                      ...snapshot,
                      id: cut.id,
                      version: cut.version,
                      assets,
                    });
                    setHistory(null);
                    onMessage(
                      "이전 버전을 초안으로 불러왔습니다. 확인 후 변경 저장해주세요.",
                    );
                  }}
                >
                  이 버전을 초안으로
                </button>
              </details>
            ))}
          </div>
        </Modal>
      )}
      {showInfo && (
        <Modal title="컷 정보" close={() => setShowInfo(false)}>
          <div className="dialog-form">
            <label>
              컷 번호
              <input
                value={draft.code}
                onChange={(e) => change({ code: e.target.value })}
              />
            </label>
            <label>
              컷 이름
              <input
                value={draft.title}
                onChange={(e) => change({ title: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                검토 상태
                <select
                  value={draft.status}
                  onChange={(e) => change({ status: e.target.value })}
                >
                  {[
                    "초안",
                    "검토",
                    "촬영 준비",
                    "작업 중",
                    "확정",
                    "보류",
                    "제외",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                길이 (초)
                <input
                  type="number"
                  min={0}
                  max={3600}
                  step={0.01}
                  value={draft.duration}
                  onChange={(e) => change({ duration: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="dialog-actions">
              <button
                className="danger-text"
                onClick={async () => {
                  if (
                    !cut.deleted_at &&
                    !window.confirm(
                      "이 컷을 휴지통으로 이동할까요? 이후 복원할 수 있습니다.",
                    )
                  )
                    return;
                  try {
                    await api(`/api/cuts/${cut.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        version: cut.version,
                        restore: !!cut.deleted_at,
                      }),
                    });
                    setShowInfo(false);
                    onMessage(
                      cut.deleted_at
                        ? "컷을 복원했습니다."
                        : "컷을 휴지통으로 이동했습니다.",
                    );
                    onDirty(false);
                    onRefresh();
                    onClose();
                  } catch (e) {
                    onMessage((e as Error).message);
                  }
                }}
              >
                <Trash2 size={15} />
                {cut.deleted_at ? "컷 복원" : "휴지통으로 이동"}
              </button>
              <button className="button" onClick={() => setShowInfo(false)}>
                닫기
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="닫기">
          <X size={18} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

function AssetLibrary({
  close,
  onSelect,
  onMessage,
}: {
  close: () => void;
  onSelect: (a: Asset) => void;
  onMessage: (m: string) => void;
}) {
  const [q, setQ] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api<Asset[]>(`/api/assets?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then(setAssets)
        .catch((e) => {
          if (!controller.signal.aborted) onMessage(e.message);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, onMessage]);
  return (
    <Modal title="공용 에셋 보관함" close={close}>
      <div className="searchbox">
        <Search size={16} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="파일명 또는 경로 검색"
          aria-label="에셋 검색"
        />
        <button className="button" onClick={() => setCreate(!create)}>
          <Plus size={15} />새 에셋
        </button>
      </div>
      {create && (
        <form
          className="dialog-form new-asset-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              const a = await api<Asset>("/api/assets", {
                method: "POST",
                body: JSON.stringify({
                  name: f.get("name"),
                  path: f.get("path"),
                  role: f.get("role"),
                  kind: f.get("kind"),
                }),
              });
              onSelect(a);
            } catch (e) {
              onMessage((e as Error).message);
            }
          }}
        >
          <label>
            원본 파일명
            <input name="name" required />
          </label>
          <label>
            원본 상대 경로
            <input
              name="path"
              required
              placeholder="05_asset/EP01/characters/file.png"
            />
          </label>
          <div className="form-row">
            <label>
              역할
              <input name="role" placeholder="캐릭터 / 배경 / 소품" />
            </label>
            <label>
              종류
              <select name="kind">
                <option value="image">이미지</option>
                <option value="video">영상</option>
                <option value="audio">음성</option>
              </select>
            </label>
          </div>
          <button className="primary">등록 후 이 컷에 연결</button>
        </form>
      )}
      <div className="library-results">
        {assets.map((a) => (
          <button key={a.id} onClick={() => onSelect(a)}>
            {a.preview && a.kind === "image" ? (
              <img src={a.preview} alt="" loading="lazy" />
            ) : (
              <span>
                <ImageIcon />
              </span>
            )}
            <span>
              <strong>{a.name}</strong>
              <small>{a.path}</small>
            </span>
            <Plus size={17} />
          </button>
        ))}
      </div>
      <p className="field-hint">
        검색 결과 최대 100개 · 파일명만으로 자동 연결하지 않습니다.
      </p>
    </Modal>
  );
}
