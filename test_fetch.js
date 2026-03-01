async function check() {
    const res = await fetch("https://lweywjgjdfobwbgfxmdv.supabase.co/rest/v1/devis", {
        method: 'POST',
        headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXl3amdqZGZvYndiZ2Z4bWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTE3NTgsImV4cCI6MjA4NjU4Nzc1OH0.Pn7Q33p5SKFGuipjikJfsuVCLWkcIL5-7JCYAYPHc48",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXl3amdqZGZvYndiZ2Z4bWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTE3NTgsImV4cCI6MjA4NjU4Nzc1OH0.Pn7Q33p5SKFGuipjikJfsuVCLWkcIL5-7JCYAYPHc48",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify({
            client_id: "788a53e4-e0c3-424a-ae77-dfb1a38f3223",
            number: "TEST-NO-EXTRA-FIELDS",
            title: "TEST",
            total_amount: 0,
            status: "pending",
            notes: "hello"
        })
    });
    const text = await res.text();
    console.log(text);
}
check();
