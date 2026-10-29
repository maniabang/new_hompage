"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Circle,
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
  Undo2,
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
import { mcpHandoff, promptIssues, syncAssetPrompt } from "@/lib/cutdesk/prompt";

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
      <img src="/brand/thetent-icon.png" alt="" width={32} height={32} />
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
  const [trashEpisode, setTrashEpisode] = useState("");
  const [restoring, setRestoring] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCut, setNewCut] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [indexLoading, setIndexLoading] = useState(true);
  const refresh = () => {
    setIndexLoading(true);
    setNonce((n) => n + 1);
  };
  useEffect(() => {
    if (!name) return;
    const controller = new AbortController();
    api<{ project: typeof project; episodes: Episode[]; cuts: CutSummary[] }>(
      `/api/workspace?episode=${trash ? trashEpisode : episode}&trash=${trash ? "1" : "0"}`,
      { signal: controller.signal },
    )
      .then((d) => {
        setProject(d.project);
        setEpisodes(d.episodes);
        setCuts(d.cuts);
        setConnected(true);
        setIndexLoading(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setMessage(e.message);
          setConnected(false);
          setIndexLoading(false);
        }
      });
    return () => controller.abort();
  }, [name, episode, trash, trashEpisode, nonce]);
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
  async function restoreCut(c: CutSummary) {
    if (restoring) return;
    setRestoring(c.id);
    try {
      await api(`/api/cuts/${c.id}`, {
        method: "PATCH",
        body: JSON.stringify({ version: c.version, restore: true }),
      });
      setCuts((items) => items.filter((item) => item.id !== c.id));
      setMessage(`${c.code} 컷을 복원했습니다.`);
      refresh();
    } catch (error) {
      setMessage((error as Error).message);
      refresh();
    } finally {
      setRestoring("");
    }
  }
  if (!name)
    return (
      <div className="login-shell">
        <header className="login-header">
          <span className="login-brand"><img src="/brand/thetent-wordmark.png" alt="theTent" width={270} height={57} /></span>
          <span>컷 작업실</span>
        </header>
        <section className="login-panel">
          <div className="login-card">
            <h1>작업실 로그인</h1>
            <p>작업자 이름과 접속 코드를 입력하세요.</p>
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
                  placeholder="이름"
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
                    placeholder="접속 코드"
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
                  <ArrowRight size={16} />
                )}
                로그인
              </button>
            </form>
            <div className="security-note">
              <ShieldCheck size={15} />
              초대된 작업자만 이용할 수 있습니다.
            </div>
          </div>
        </section>
      </div>
    );
  return (
    <div className="desk">
      <aside className="rail">
        <Link className="rail-brand" href="/" aria-label="theTent 컷 작업실">
          <Mark />
        </Link>
        <button
          className={!trash ? "active" : ""}
          aria-label="컷 작업실"
          title="컷 작업실"
          onClick={() => {
            if (allow()) {
              setTrash(false);
              if (trash) {
                setIndexLoading(true);
                setCuts([]);
              }
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
              if (!trash) {
                setIndexLoading(true);
                setTrashEpisode("");
                setCuts([]);
              }
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
            <strong>컷 작업실</strong>
            <span>/</span>
            <span>{project?.title || "제작 작업실"}</span>
            <ChevronRight size={12} />
            <b>{trash ? "휴지통" : "제작 관리"}</b>
          </div>
          <div className="top-actions">
            <span className="cloud-status" data-connected={connected}>
              <i />
              {connected === null ? "연결 중" : connected ? "연결됨" : "연결 확인 필요"}
            </span>
            <button
              className="icon-button"
              onClick={() => {
                if (allow()) {
                  setDirty(false);
                  setCut(null);
                  setLoading(!!selected);
                  refresh();
                }
              }}
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
                <a href="/api/export">작업 내용·수정 이력 다운로드</a>
                <a href="/api/source">Drive 원본 다운로드</a>
              </div>
            </details>
            <span className="user-name">{name}</span>
          </div>
        </header>
        <div className="overview">
          <div>
            <h1>{trash ? "휴지통" : project?.title || "제작 관리"}</h1>
            <span className="cut-total">{project && !(trash && indexLoading) ? `${trash ? cuts.length : total}개 컷` : "불러오는 중"}</span>
          </div>
          {!trash && <span className="review-summary">
            <CheckCheck size={14} />
            확정 {project ? reviewed : "—"}<span>/ {project ? total : "—"}</span>
          </span>}
        </div>
        {message && (
          <div className="notice" role="alert">
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="알림 닫기">
              <X size={16} />
            </button>
          </div>
        )}
        {trash ? (
          <TrashList
            cuts={cuts}
            episodes={episodes}
            episode={trashEpisode}
            loading={indexLoading}
            restoring={restoring}
            onEpisode={(value) => {
              setTrashEpisode(value);
              setCuts([]);
              setIndexLoading(true);
            }}
            onRestore={restoreCut}
          />
        ) : <div className="workspace" data-detail={!!selected}>
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
                      setIndexLoading(true);
                      setCuts([]);
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
              <span>{indexLoading ? "불러오는 중" : `${filtered.length}개 컷`}</span>
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
                      <span>에셋 {c.asset_count}</span>
                      <span>{Number(c.duration).toFixed(1)}s</span>
                    </span>
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {indexLoading && !cuts.length && (
                <div className="empty-small" role="status">
                  <Loader2 className="spin" size={20} />
                  <p>컷을 불러오는 중입니다.</p>
                </div>
              )}
              {!indexLoading && !filtered.length && (
                <div className="empty-small">
                  <FolderOpen />
                  <p>표시할 컷이 없습니다.</p>
                  <small>회차나 검색 조건을 확인해주세요.</small>
                </div>
              )}
            </div>
            <div className="library-foot">
              <span className="tiny-dot" />
              {episodes.length}개 회차 · {total}개 컷
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
                <Layers3 size={28} strokeWidth={1.5} />
                <h2>컷을 선택하세요</h2>
                <p>프롬프트와 참조 에셋을 확인하고 편집할 수 있습니다.</p>
              </div>
            )}
          </main>
        </div>}
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

function TrashList({ cuts, episodes, episode, loading, restoring, onEpisode, onRestore }: {
  cuts: CutSummary[];
  episodes: Episode[];
  episode: string;
  loading: boolean;
  restoring: string;
  onEpisode: (value: string) => void;
  onRestore: (cut: CutSummary) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const visible = cuts.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <main className="trash-view" aria-label="휴지통">
      <div className="trash-tools">
        <div className="searchbox">
          <Search size={15} />
          <input aria-label="삭제된 컷 검색" placeholder="컷 번호, 이름 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select aria-label="휴지통 회차" value={episode} onChange={(e) => onEpisode(e.target.value)}>
          <option value="">전체 회차</option>
          {episodes.map((e) => <option key={e.code} value={e.code}>{e.code} · {e.title}</option>)}
        </select>
      </div>
      {loading && !cuts.length ? (
        <div className="trash-empty" role="status"><Loader2 className="spin" size={22} /><p>불러오는 중입니다.</p></div>
      ) : !visible.length ? (
        <div className="trash-empty">
          <Trash2 size={26} strokeWidth={1.5} />
          <p>{query || episode ? "조건에 맞는 컷이 없습니다." : "휴지통이 비어 있습니다."}</p>
        </div>
      ) : (
        <ul className="trash-list" aria-label="삭제된 컷">
          {visible.map((c) => (
            <li className="trash-row" key={c.id}>
              <div>
                <span className="cut-code">{c.code}</span>
                <h2>{c.title}</h2>
                <p>{c.deleted_at && date(c.deleted_at)} 삭제 · {c.updated_by}</p>
              </div>
              <button className="button" aria-label={`${c.code} 복원`} disabled={!!restoring} onClick={() => onRestore(c)}>
                {restoring === c.id ? <Loader2 className="spin" size={15} /> : <Undo2 size={15} />}
                {restoring === c.id ? "복원 중" : "복원"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
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
  const [mobilePane, setMobilePane] = useState<"prompt" | "assets">("prompt");
  const [tab, setTab] = useState<"prompt" | "work" | "brief" | "draft">(
    cut.work_prompt ? "work" : "prompt",
  );
  const [history, setHistory] = useState<Version[] | null>(null);
  const [library, setLibrary] = useState(false);
  const [preview, setPreview] = useState<Asset | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [recovery, setRecovery] = useState<Cut | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const wasDirty = useRef(false);
  const dirty =
    JSON.stringify(editable(draft)) !== JSON.stringify(editable(cut));
  const change = useCallback(
    (fields: Partial<Cut>) => setDraft((d) => ({ ...d, ...fields })),
    [],
  );
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  useEffect(() => {
    try {
      if (!dirty) {
        if (wasDirty.current) localStorage.removeItem(`cutdesk-draft-${cut.id}`);
        wasDirty.current = false;
        return;
      }
      wasDirty.current = true;
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
  const referenceIssues = promptIssues(tab === "work" ? draft.work_prompt : tab === "draft" ? draft.prompt_draft : draft.prompt, draft.assets);
  const updateAssets = (assets: Asset[]) => {
    change({ assets, work_prompt: syncAssetPrompt(draft.work_prompt || draft.prompt, assets) });
    setTab("work");
  };
  const text =
    tab === "draft"
      ? draft.prompt_draft
      : tab === "work"
        ? draft.work_prompt
        : draft.prompt;
  const references = useMemo(() => [...text.matchAll(/@\{([^}]+)\}|@(Image|Audio|Video)\d+\b/gi)], [text]);
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
  async function copyRequest() {
    try {
      const prompt = tab === "draft" ? draft.work_prompt || draft.prompt : text;
      await navigator.clipboard.writeText(mcpHandoff(draft, prompt));
      onMessage("컷 번호·프롬프트·파일명·경로를 담은 MCP 요청문을 복사했습니다.");
    } catch {
      onMessage("클립보드를 사용할 수 없습니다. 프롬프트를 선택해 복사해주세요.");
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
    if (tab === "brief") setTab("prompt");
    setMobilePane("prompt");
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
          {recovery.version !== cut.version && (
            <span>
              서버에 새 버전이 있습니다. 최신 내용과 비교한 뒤 초안을
              적용해주세요.
            </span>
          )}
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
      <div className="pane-switch" aria-label="작업 화면">
        <button aria-pressed={mobilePane === "prompt"} onClick={() => setMobilePane("prompt")}>
          <Film size={15} />프롬프트
        </button>
        <button aria-pressed={mobilePane === "assets"} onClick={() => setMobilePane("assets")}>
          <ImageIcon size={15} />참조 에셋 <span>{selected.length}</span>
        </button>
      </div>
      <div className="editor-columns" data-pane={mobilePane}>
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
            {draft.chief_review && tab !== "brief" && (
              <details className="chief-review">
                <summary>Chief 검토 · r{draft.chief_review.verified_revision} · {draft.chief_review.application === "applied" ? "작업 프롬프트 반영" : draft.chief_review.application === "excluded" ? "생성 제외" : "확인 사항 있음"}</summary>
                <p>{draft.chief_review.status}</p>
                {draft.chief_review.issues.length > 0 && <ul>{draft.chief_review.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>}
                <p>최신 원문·작업 편집을 우선하며, 생성 전 실제 첨부 파일을 다시 대조합니다.</p>
                {draft.chief_review.application !== "applied" && <details><summary>이전 검토안 보기</summary><textarea readOnly aria-label="Chief 참조 정리안" value={draft.chief_review.proposal} rows={6} /></details>}
              </details>
            )}
            {tab === "brief" ? (
              <div className="brief-form">
                <label>
                  <span className="section-label">줄콘티</span>
                  <textarea
                    value={draft.story}
                    onChange={(e) => change({ story: e.target.value })}
                    rows={10}
                  />
                </label>
                <label>
                  <span className="section-label">대사</span>
                  <textarea
                    value={draft.dialogue}
                    onChange={(e) => change({ dialogue: e.target.value })}
                    rows={5}
                  />
                </label>
                <label>
                  <span className="section-label">작업 메모</span>
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
                      ? "MCP 전달문"
                      : tab === "work"
                        ? "작업 프롬프트"
                        : "기본 프롬프트"}
                  </span>
                  <div className="prompt-actions">
                    {tab !== "draft" && <button onClick={() => { updateAssets(draft.assets); onMessage("선택한 파일명과 사용 범위를 작업 프롬프트에 정리했습니다."); }}>참조 정리</button>}
                    <button onClick={copy} disabled={tab !== "draft" && (referenceIssues.length > 0 || draft.chief_review?.application === "excluded")} title={referenceIssues[0] || "현재 프롬프트 복사"}><Copy size={14} />프롬프트 복사</button>
                    <button onClick={copyRequest}><Copy size={14} />MCP 요청문 복사</button>
                  </div>
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
                  {!referenceIssues.length ? (
                    <p className={references.length ? "good" : ""}>{references.length ? "파일명 태그가 선택한 에셋과 일치합니다." : "참조 정리를 누르면 선택한 파일명이 반영됩니다."}</p>
                  ) : (
                    <ul className="reference-issues">{referenceIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
        <aside className="assets-pane">
          <header>
            <div>
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
            선택한 에셋의 파일명 태그를 삽입하세요.
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
                        updateAssets(draft.assets.map((x) =>
                            x.id === a.id
                              ? { ...x, selected: e.target.checked }
                              : x,
                          ))
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
                  <button className="asset-name-copy" onClick={async () => {
                    try { await navigator.clipboard.writeText(a.name); onMessage("원본 파일명을 복사했습니다."); }
                    catch { onMessage("파일명을 선택해 복사해주세요."); }
                  }}>파일명 복사</button>
                  <details>
                    <summary>경로 · 사용 메모</summary>
                    <p className="asset-path">{a.path}</p>
                    <textarea
                      aria-label={`${a.name} 사용 메모`}
                      value={a.note}
                      onChange={(e) =>
                        updateAssets(draft.assets.map((x) =>
                            x.id === a.id ? { ...x, note: e.target.value } : x,
                          ))
                      }
                      rows={3}
                    />
                    <button
                      className="text-button"
                      onClick={() =>
                        updateAssets(draft.assets.filter((x) => x.id !== a.id))
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
                ? "저장 중"
                : dirty
                  ? "저장하지 않은 변경"
                  : "저장됨"}
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
            updateAssets(draft.assets.some((x) => x.id === a.id)
              ? draft.assets.map(x => x.id === a.id ? { ...x, selected: true } : x)
              : [...draft.assets, { ...a, selected: true }]);
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
