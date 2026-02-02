const $ = (id) => document.getElementById(id);

function slugify(s){
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-]/g, "");
}

function setMsg(text, kind){
  const el = $("msg");
  el.textContent = text || "";
  el.className = "msg" + (kind ? " " + kind : "");
}

$("generateBtn").addEventListener("click", async () => {
  setMsg("Gerando...", "");
  const payload = {
    addonName: $("addonName").value.trim(),
    addonAcronym: slugify($("addonAcronym").value),
    creator: $("creator").value.trim(),
    creatorAcronym: slugify($("creatorAcronym").value),
  };

  try{
    const res = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const data = await res.json().catch(()=>null);
      const msg = data?.errors ? data.errors.join(" ") : "Erro ao gerar.";
      setMsg(msg, "error");
      return;
    }

    const blob = await res.blob();
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `rc_${payload.addonAcronym}_template.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setMsg("Pronto! Download iniciado.", "ok");
  } catch(err){
    console.error(err);
    setMsg("Falha: " + String(err?.message || err), "error");
  }
});
