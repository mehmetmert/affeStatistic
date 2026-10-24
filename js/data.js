/* ============================================================================
   affeStats — Referans Veri Katmanı
   İçerik: Anscombe Dörtlüsü (klasik, tam değerleriyle) · scienceWiki İçeriği
   ============================================================================ */
(function () {
  'use strict';

  /* ==========================================================================
     ANSCOMBE DÖRTLÜSÜ (F. Anscombe, 1973) — tam klasik değerler.
     Her 4 veri setinin x̄, ȳ, s_x, s_y, r ve OLS doğrusu neredeyse birebir
     aynıdır (r ≈ 0.816), ama grafiğe dökülünce tamamen farklı görünürler.
     ========================================================================== */
  const ANSCOMBE = {
    I: {
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68],
      desc: 'Klasik doğrusal ilişki + normal gürültü — regresyonun "ders kitabı" senaryosu.'
    },
    II: {
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [9.14, 8.14, 8.74, 8.77, 9.26, 8.10, 6.13, 3.10, 9.13, 7.26, 4.74],
      desc: 'Gerçekte doğrusal DEĞİL, belirgin bir parabol — doğrusal regresyon modeli yanlış.'
    },
    III: {
      x: [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5],
      y: [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73],
      desc: 'Tek bir aykırı değer (x=13, y=12.74) tüm regresyon doğrusunu kendine çekiyor.'
    },
    IV: {
      x: [8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8],
      y: [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.50, 5.56, 7.91, 6.89],
      desc: 'Neredeyse tüm x değerleri aynı — tek bir yüksek-kaldıraçlı nokta (x=19) "sahte" bir korelasyon yaratıyor.'
    }
  };

  /* ==========================================================================
     SCIENCEWIKI "AKADEMİK BİLGİ & TEORİ" İÇERİĞİ
     ========================================================================== */
  const SCIENCE_WIKI = {
    stats1_1: {
      title: 'Galton Kutusu (Quincunx) ve Binom → Normal Yakınsaması',
      intuitive: 'Her top, her çividen bağımsız olarak %50 ihtimalle sağa ya da sola sapıyor — tıpkı $n$ kere yazı-tura atmak gibi. Tek bir topun nereye düşeceği tamamen şans, ama binlerce top bir araya gelince sonuç kesinlikle öngörülebilir bir çan eğrisi oluşturuyor: rastgelelik ile düzen aynı anda var olabiliyor.',
      history: 'Sir Francis Galton, 1889\'da <i>Natural Inheritance</i> kitabında bu düzeneği "Quincunx" adıyla tanıttı ve kalıtımın istatistiksel doğasını görselleştirmek için kullandı. Galton kutusu bugün hâlâ Binom Dağılımı → Normal Dağılım yakınsamasını (De Moivre-Laplace Teoremi, 1733) öğretmenin en sezgisel yoludur.',
      formulas: [
        { tex: '\\mu = np, \\quad \\sigma^2 = np(1-p)', desc: '$n$ çivi satırı ve $p$ sağa-sapma olasılığıyla Binom dağılımının teorik ortalaması ve varyansı.' },
        { tex: 'P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}', desc: 'Bir topun tam olarak $k$ kez sağa sapma olasılığı (Binom Olasılık Kütle Fonksiyonu).' }
      ],
      tasks: [
        { step: '$p$\'yi 0.5\'ten 0.2\'ye çekin; histogramın simetrik çan eğrisinden sola çarpık bir şekle nasıl dönüştüğünü gözlemleyin.', preset: { sub: '1_1', p: 0.2 } },
        { step: 'Çivi satırı sayısını ($n$) artırarak deneysel histogramın teorik Normal eğriye ne kadar daha iyi oturduğunu görün.', preset: { sub: '1_1', rows: 24 } }
      ]
    },
    stats1_2: {
      title: 'Merkezi Limit Teoremi (CLT) Laboratuvarı',
      intuitive: 'Anakütleniz ister tekdüze, ister çarpık, ister iki tepeli olsun — fark etmez. Yeterince büyük ($n \\ge 30$) örneklemler çekip her birinin ortalamasını hesapladığınızda, bu ortalamaların DAĞILIMI neredeyse her zaman bir Normal (Gauss) dağılımına benzer. Bu, modern çıkarımsal istatistiğin (güven aralıkları, hipotez testleri) temel taşıdır.',
      history: 'CLT\'nin kökleri Abraham de Moivre\'nin 1733 çalışmasına dayanır, ancak modern kesin ispatı Aleksandr Lyapunov (1901) ve Jarl Waldemar Lindeberg (1920\'ler) tarafından tamamlandı. Pierre-Simon Laplace de 1810\'da teoremi genişleterek istatistiksel hata analizine uyguladı.',
      formulas: [
        { tex: '\\bar{X} \\sim N\\left(\\mu, \\frac{\\sigma^2}{n}\\right) \\text{ as } n \\to \\infty', desc: 'Örneklem ortalamasının dağılımı, anakütle ne olursa olsun $n$ büyüdükçe Normal\'e yakınsar.' },
        { tex: '\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}}', desc: 'Standart Hata (Standard Error): örneklem ortalamalarının yayılımı, örneklem büyüklüğünün kareköküyle ters orantılı azalır.' }
      ],
      tasks: [
        { step: 'Anakütleyi "Üstel (Sağa Çarpık)" seçin, $n=1$ ile örneklem çekin — dağılımın hâlâ çarpık olduğunu görün.', preset: { sub: '1_2', population: 'exponential', n: 1 } },
        { step: 'Aynı anakütlede $n=30$\'a çıkarın — örneklem ortalamaları dağılımının artık simetrik bir çan eğrisi olduğunu kanıtlayın.', preset: { sub: '1_2', population: 'exponential', n: 30 } }
      ]
    },
    stats1_3: {
      title: 'Büyük Sayılar Yasası (Law of Large Numbers)',
      intuitive: 'Adil bir madeni parayı 10 kez attığınızda %70 yazı gelebilir — bu tamamen normal. Ama 100.000 kez atarsanız, kümülatif ortalama kaçınılmaz olarak %50\'ye yaklaşır. "Şans eseri" sapmalar, deneme sayısı arttıkça etkisini kaybeder; bu, kumarhanelerin ve sigorta şirketlerinin neden uzun vadede her zaman kâr ettiğinin matematiksel temelidir.',
      history: 'Jacob Bernoulli, 1713\'te ölümünden sonra yayımlanan <i>Ars Conjectandi</i> eserinde "Zayıf Büyük Sayılar Yasası"nı ilk kez kanıtladı — buna kendisi "Altın Teorem" adını vermişti. Simeon Denis Poisson 1837\'de terimi popülerleştirdi.',
      formulas: [
        { tex: 'P\\left(\\left|\\frac{1}{n}\\sum_{i=1}^n X_i - E[X]\\right| > \\epsilon\\right) \\to 0 \\text{ as } n \\to \\infty', desc: 'Zayıf Büyük Sayılar Yasası: örneklem ortalamasının gerçek beklenen değerden sapma olasılığı, $n$ büyüdükçe sıfıra gider.' }
      ],
      tasks: [
        { step: 'Hileli bir zar (6 gelme olasılığı yüksek) seçip $N=100.000$ denemeye kadar çalıştırın; kümülatif ortalamanın teorik $E[X]$\'e değil, zarın GERÇEK beklenen değerine yakınsadığını görün.', preset: { sub: '1_3', loaded: true } }
      ]
    },
    stats2_1: {
      title: 'Olasılık Dağılımları Atlası',
      intuitive: 'Her olasılık dağılımı, farklı bir "rastgelelik hikâyesi" anlatır: Binom art arda başarı/başarısızlık sayar, Poisson nadir olayların sıklığını sayar, Normal birçok küçük bağımsız etkinin toplamını modeller, Üstel bir sonraki olaya kadar geçen süreyi modeller. PDF eğrisinin altındaki alanı seçerek $P(a \\le X \\le b)$\'yi doğrudan "görebilirsiniz" — artık kağıt Z-tablosuna gerek yok.',
      history: 'Normal dağılım Carl Friedrich Gauss (1809) ve Pierre-Simon Laplace\'ın çalışmalarıyla şekillendi. Siméon Denis Poisson 1837\'de nadir olay dağılımını tanımladı. Student\'s t-dağılımı, William Sealy Gosset tarafından 1908\'de Guinness Bira Fabrikası\'ndaki küçük örneklem problemlerini çözmek için "Student" takma adıyla yayımlandı.',
      formulas: [
        { tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}', desc: 'Normal (Gauss) dağılımının olasılık yoğunluk fonksiyonu (PDF).' },
        { tex: 'P(a \\le X \\le b) = \\int_a^b f(x)\\,dx = F(b) - F(a)', desc: 'Seçilen aralıktaki olasılık, PDF\'nin o aralıktaki integrali (CDF farkı) ile bulunur.' }
      ],
      tasks: [
        { step: '"Standart Normal" seçin, $a=-1.96$ ve $b=1.96$ sınırlarını sürükleyin — alanın yaklaşık %95 çıktığını doğrulayın.', preset: { sub: '2_1', distribution: 'normal', a: -1.96, b: 1.96 } },
        { step: 'Student\'s t dağılımında serbestlik derecesini ($\\nu$) 2\'den 100\'e çıkarın — kuyrukların incelip eğrinin Normal\'e nasıl yaklaştığını izleyin.', preset: { sub: '2_1', distribution: 't', dof: 2 } }
      ]
    },
    stats2_2: {
      title: 'Klasik İstatistik Tabloları (Z / t / χ²)',
      intuitive: 'Bilgisayarlardan önce istatistikçiler, her hesaplama için integral almak yerine önceden hesaplanmış bu tabloları kullanırdı. Z-tablosu bir değerin standart normal eğrinin solunda kalan alanını (kümülatif olasılık) verir; t ve χ² tabloları ise hipotez testlerinde "kritik değer" denen eşik noktalarını verir — hesaplanan test istatistiğiniz bu eşiği geçerse sonuç "istatistiksel olarak anlamlı" sayılır.',
      history: 'Karl Pearson 1914\'te ilk kapsamlı istatistik tablolarını yayımladı; Ronald Fisher 1925\'teki <i>Statistical Methods for Research Workers</i> kitabıyla bugün hâlâ kullanılan t ve χ² kritik değer tablolarının standart formatını oturttu. Bu kitap, 20. yüzyılın en çok atıf alan bilimsel eserlerinden biridir.',
      formulas: [
        { tex: '\\Phi(z) = P(Z \\le z) = \\int_{-\\infty}^{z} \\frac{1}{\\sqrt{2\\pi}} e^{-t^2/2}\\,dt', desc: 'Z-tablosundaki her hücre, standart normal dağılımın kümülatif dağılım fonksiyonudur.' },
        { tex: 'P(T_{\\nu} > t_{\\alpha,\\nu}) = \\alpha, \\quad P(\\chi^2_{\\nu} > \\chi^2_{\\alpha,\\nu}) = \\alpha', desc: 't ve χ² tablolarındaki her hücre, o serbestlik derecesinde sağ kuyruk alanı tam olarak α olan kritik değerdir.' }
      ],
      tasks: [
        { step: 'Z-tablosunda 1.96 değerini arayın (kutuya yazın) — hücrenin 0.975 civarında olduğunu, yani $P(Z \\le 1.96) \\approx 0.975$ olduğunu doğrulayın.', preset: { sub: '2_2', tableKind: 'z' } },
        { step: 'χ²-tablosunda df=5, α=0.05 kritik değerine bakıp, Modül 3.4\'teki Ki-Kare testi sonucuyla karşılaştırın.', preset: { sub: '2_2', tableKind: 'chisq' } }
      ]
    },
    stats3_1: {
      title: 'Hipotez Testi: Tip I/II Hata ve İstatistiksel Güç',
      intuitive: '$H_0$ (sıfır hipotezi, "etki yok") ve $H_1$ (alternatif, "etki var") iki ayrı çan eğrisi gibi düşünülebilir. Kritik değerin solunda/sağında kalan bölgeler dört olası sonucu temsil eder: doğru karar, Tip I hata (yanlış pozitif, $\\alpha$), Tip II hata (yanlış negatif, $\\beta$) ve İstatistiksel Güç ($1-\\beta$, gerçek bir etkiyi yakalama olasılığı).',
      history: 'Ronald Fisher 1925\'te $p$-değeri kavramını ve anlamlılık testini tanımladı. Jerzy Neyman ve Egon Pearson 1933\'te bugün kullanılan Tip I/Tip II hata ve İstatistiksel Güç çerçevesini geliştirdi — Fisher ile bu ikili arasındaki felsefi tartışma istatistik tarihinin en ünlü akademik çekişmelerinden biridir.',
      formulas: [
        { tex: '\\alpha = P(\\text{Reddet } H_0 \\mid H_0 \\text{ doğru})', desc: 'Tip I Hata: sıfır hipotezi doğruyken yanlışlıkla reddetme olasılığı (genellikle 0.05).' },
        { tex: '\\beta = P(\\text{Reddetme } H_0 \\mid H_1 \\text{ doğru}), \\quad \\text{Güç} = 1-\\beta', desc: 'Tip II Hata ve İstatistiksel Güç: gerçek bir etkiyi test ederek doğru şekilde tespit etme olasılığı.' }
      ],
      tasks: [
        { step: 'Örneklem büyüklüğünü ($n$) artırın — İstatistiksel Gücün nasıl yükseldiğini (yeşil alanın büyüdüğünü) gözlemleyin.', preset: { sub: '3_1', n: 80 } },
        { step: '$\\alpha$\'yı 0.05\'ten 0.01\'e düşürün; Tip I hatanın azaldığını ama Tip II hatanın (ve dolayısıyla düşük gücün) arttığını fark edin — bu klasik bir ödünleşimdir (trade-off).', preset: { sub: '3_1', alpha: 0.01 } }
      ]
    },
    stats3_2: {
      title: 'Güven Aralığı (Confidence Interval) Yağmuru',
      intuitive: '"%95 güven aralığı" sık yanlış anlaşılır: tek bir aralığın gerçek $\\mu$\'yü içerme "olasılığı" %95 değildir — $\\mu$ sabittir, ya içindedir ya değildir. Doğru yorum: AYNI yöntemle 100 farklı örneklem çekip 100 farklı aralık hesaplarsanız, bunların yaklaşık 95 tanesi gerçek $\\mu$\'yü yakalar. Bu simülasyon tam olarak bunu gösteriyor.',
      history: 'Güven aralığı kavramı Jerzy Neyman tarafından 1937\'de resmi olarak tanımlandı; Fisher\'in "güvenilirlik" (fiducial) yaklaşımına alternatif olarak geliştirildi ve bugün frekansçı istatistiğin standart aracı haline geldi.',
      formulas: [
        { tex: '\\bar{x} \\pm t_{\\alpha/2, \\, n-1} \\cdot \\frac{s}{\\sqrt{n}}', desc: 'Bilinmeyen $\\sigma$ için Student\'s t dağılımına dayalı güven aralığı formülü.' }
      ],
      tasks: [
        { step: 'Güven düzeyini %95\'ten %99\'a çıkarın — çubukların uzadığını (daha geniş aralık, daha az kaçırma) gözlemleyin.', preset: { sub: '3_2', level: 0.99 } }
      ]
    },
    stats3_3: {
      title: 'Bootstrap (Yeniden Örnekleme) Makinesi',
      intuitive: 'Elinizde sadece küçük bir örneklem (örn. 15 gözlem) var ve anakütlenin dağılımını bilmiyorsunuz. Bootstrap, bu küçük örneklemden "yerine koyarak" (with replacement) binlerce yeni alt-örneklem çekip her birinin istatistiğini (ortalama, medyan...) hesaplayarak, hiçbir dağılım varsayımı yapmadan standart hatayı tahmin etmenizi sağlar.',
      history: 'Bradley Efron, 1979\'da "Bootstrap" yöntemini tanıttı — isim, "kendi ayakkabı bağcıklarından kendini yukarı çekmek" (bootstrap) deyiminden gelir: veri, kendi belirsizliğini kendi içinden tahmin eder.',
      formulas: [
        { tex: 'SE_{\\text{boot}} = \\sqrt{\\frac{1}{B-1}\\sum_{b=1}^B (\\hat\\theta_b - \\bar{\\hat\\theta})^2}', desc: '$B$ bootstrap örnekleminden hesaplanan istatistiğin ($\\hat\\theta_b$) standart sapması, parametrik olmayan standart hata tahminidir.' }
      ],
      tasks: [
        { step: 'Bootstrap tekrar sayısını ($B$) 100\'den 5000\'e çıkarın — dağılımın pürüzsüzleştiğini ve güven aralığının stabilleştiğini görün.', preset: { sub: '3_3', B: 5000 } }
      ]
    },
    stats3_4: {
      title: 'Ki-Kare ($\\chi^2$) Testi: Uygunluk ve Bağımsızlık',
      intuitive: 'Ki-Kare testi, "gözlenen" sayılarla "beklenen" (teorik/rastgele) sayılar arasındaki farkın şans eseri mi yoksa gerçek bir etki mi olduğunu ölçer. Uygunluk testi bir zarın adil olup olmadığını sınar; bağımsızlık testi iki kategorik değişkenin (örn. cinsiyet ve tercih) birbiriyle ilişkili olup olmadığını bir kontenjans tablosuyla sınar.',
      history: 'Karl Pearson, 1900\'de $\\chi^2$ testini tanıttı ve bu, modern istatistiksel hipotez testinin ilk biçimsel araçlarından biri oldu. Ronald Fisher daha sonra serbestlik derecesi hesabındaki bir hatayı düzeltti — bu ikisi arasındaki tartışma, istatistik tarihinin önemli dönüm noktalarından biridir.',
      formulas: [
        { tex: '\\chi^2 = \\sum_{i=1}^k \\frac{(O_i - E_i)^2}{E_i}', desc: 'Gözlenen ($O_i$) ve beklenen ($E_i$) frekanslar arasındaki toplam standartlaştırılmış kare fark.' },
        { tex: 'df = k - 1 \\ (\\text{uygunluk}), \\quad df = (r-1)(c-1) \\ (\\text{bağımsızlık})', desc: 'Serbestlik derecesi, uygunluk testinde kategori sayısına, bağımsızlık testinde tablo boyutuna bağlıdır.' }
      ],
      tasks: [
        { step: 'Bir zarı 600 kez "at" ve gözlenen frekansların adil zarın beklentisinden (her yüz için 100) ne kadar saptığını, $\\chi^2$ istatistiğinin ve $p$-değerinin nasıl değiştiğini izleyin.', preset: { sub: '3_4', mode: 'goodness', rolls: 600 } },
        { step: 'Bağımsızlık testine geçip 2×2 kontenjans tablosundaki bir hücreyi büyütün — $\\chi^2$ değerinin ve $p$-değerinin nasıl tepki verdiğini gözlemleyin.', preset: { sub: '3_4', mode: 'independence' } }
      ]
    },
    stats4_1: {
      title: 'Bayes Teoremi: Tıbbi Test Paradoksu',
      intuitive: 'Test %99 "doğru" olsa bile, hastalık toplumda çok nadirse (%0.1), pozitif çıkan kişilerin büyük çoğunluğu aslında SAĞLIKLIDIR — çünkü sağlıklı insan sayısı o kadar fazladır ki, testin küçük hata oranı bile çok sayıda "yanlış pozitif" üretir. 1000 kişilik ızgarada bunu gözle görmek, formülden çok daha ikna edicidir.',
      history: 'Rahip Thomas Bayes\'in teoremi 1763\'te ölümünden sonra yayımlandı; Pierre-Simon Laplace bunu bağımsız olarak yeniden keşfedip genişletti. II. Dünya Savaşı\'nda Alan Turing ve ekibi, Enigma şifresini kırarken Bayesçi olasılık güncellemesini (Banburismus) kullandı.',
      formulas: [
        { tex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}', desc: 'Bayes Teoremi: $B$ kanıtı gözlemlendiğinde $A$ hipotezinin güncellenmiş (sonsal) olasılığı.' },
        { tex: 'P(B) = P(B|A)P(A) + P(B|\\neg A)P(\\neg A)', desc: 'Toplam Olasılık Kuralı: paydadaki $P(B)$, tüm senaryolar toplanarak hesaplanır.' }
      ],
      tasks: [
        { step: 'Hastalık yaygınlığını %0.1\'den %10\'a çıkarın — $P(A|B)$\'nin (gerçekten hasta olma olasılığı) nasıl dramatik şekilde arttığını gözlemleyin.', preset: { sub: '4_1', prevalence: 0.10 } }
      ]
    },
    stats4_2: {
      title: 'Sürekli Bayesçi Güncelleme (Prior → Posterior)',
      intuitive: 'Bir madeni paranın adil olup olmadığından emin değilsiniz. Önsel inancınızla (prior) başlarsınız, her yeni yazı-tura sonucuyla inancınızı güncellersiniz (posterior). Beta dağılımı, "0 ile 1 arasında bir olasılık hakkındaki belirsizliğimiz" için matematiksel olarak mükemmel bir dildir.',
      history: 'Beta-Binom eşlenik (conjugate) ailesi, Bayesçi istatistiğin hesaplanabilir hale gelmesinin temel nedenlerinden biridir — posterior, kapalı formda yine bir Beta dağılımı olarak kalır, karmaşık integral almaya gerek kalmaz.',
      formulas: [
        { tex: '\\text{Posterior} \\sim \\text{Beta}(\\alpha_0 + k,\\ \\beta_0 + n - k)', desc: '$\\text{Beta}(\\alpha_0,\\beta_0)$ öncesi ile $n$ denemede $k$ başarı gözlemlendiğinde sonsal dağılım.' }
      ],
      tasks: [
        { step: 'Başlangıçta "Düz/Bilgisiz" önsel (Beta(1,1)) seçin, 20 yazı-tura sonucu ekleyin — sonsal dağılımın gerçek $p$ değerine nasıl daraldığını izleyin.', preset: { sub: '4_2' } }
      ]
    },
    stats4_3: {
      title: 'Monty Hall (3 Kapı) Paradoksu',
      intuitive: 'İlk seçiminizin doğru kapı olma ihtimali 1/3\'tür — ve sunucu bir kapıyı açsa bile bu hiç değişmez. Ama "kapı değiştirirseniz" kazanma ihtimaliniz 1/3 değil 2/3\'e çıkar, çünkü sunucunun hangi kapıyı açacağını bilerek seçmesi ekstra bilgi taşır. Bu, insan sezgisinin olasılıkta en sık yanıldığı klasik örnektir.',
      history: 'Problem adını 1960-1990 arası yayınlanan "Let\'s Make a Deal" programının sunucusu Monty Hall\'dan alır. 1990\'da Marilyn vos Savant doğru cevabı (değiştir!) köşesinde yazınca, aralarında matematikçilerin de olduğu binlerce okuyucudan itiraz mektubu aldı — sonunda simülasyonlar onu haklı çıkardı.',
      formulas: [
        { tex: 'P(\\text{kazan} \\mid \\text{değiştir}) = \\frac{2}{3}, \\quad P(\\text{kazan} \\mid \\text{kal}) = \\frac{1}{3}', desc: 'İki stratejinin teorik kazanma olasılıkları.' }
      ],
      tasks: [
        { step: '"10.000 Kez Otomatik Oyna" düğmesine basıp iki stratejinin deneysel kazanma oranlarının teorik 1/3 ve 2/3\'e ne kadar yakın çıktığını karşılaştırın.', preset: { sub: '4_3', autoplay: 10000 } }
      ]
    },
    stats5_1: {
      title: 'En Küçük Kareler (OLS) Regresyonu ve Korelasyon',
      intuitive: 'Regresyon doğrusu, tüm noktalardan dikey uzaklıkların KARELERİNİN toplamını minimize eden tek doğrudur — karelerini almamızın sebebi, hem pozitif hem negatif hataların "iptal olmasını" önlemek hem de büyük hatalara orantısız ceza vermektir. Pearson $r$ ilişkinin DOĞRUSAL gücünü ve yönünü ölçer; $R^2$ ise $y$\'deki değişimin yüzde kaçının $x$ tarafından açıklandığını söyler.',
      history: 'En Küçük Kareler yöntemi bağımsız olarak Adrien-Marie Legendre (1805) ve Carl Friedrich Gauss (1809, gezegen yörüngesi hesaplarında) tarafından geliştirildi. Korelasyon katsayısını ise Francis Galton\'ın öğrencisi Karl Pearson 1896\'da formülleştirdi.',
      formulas: [
        { tex: '\\hat{y} = \\beta_0 + \\beta_1 x, \\quad \\beta_1 = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sum (x_i-\\bar{x})^2}', desc: 'OLS regresyon doğrusunun eğimi, $x$ ve $y$\'nin kovaryansının $x$\'in varyansına oranıdır.' },
        { tex: 'r = \\frac{\\text{Cov}(x,y)}{s_x s_y}, \\quad R^2 = r^2', desc: 'Pearson korelasyon katsayısı ve Belirlilik Katsayısı (doğrusal regresyonda $R^2 = r^2$).' }
      ],
      tasks: [
        { step: 'Sahneye 8-10 nokta ekleyip doğal bir doğrusal ilişki oluşturun, ardından TEK bir noktayı çok uzağa sürükleyin — regresyon doğrusunun o tek noktaya nasıl "kilitlendiğini" gözlemleyin.', preset: { sub: '5_1' } }
      ]
    },
    stats5_2: {
      title: 'Anscombe Dörtlüsü',
      intuitive: 'Dört farklı veri seti, virgülden sonraki haneye kadar AYNI ortalama, varyans, korelasyon ($r\\approx0.816$) ve regresyon doğrusuna sahiptir — ama birini çizince düzgün bir doğru, birini çizince parabol, birini çizince tek bir aykırı değerin bozduğu bir doğru, birini çizince dikey bir çizgi + tek nokta görürsünüz. Ders: özet istatistiklere asla veriyi GÖRMEDEN güvenmeyin.',
      history: 'İstatistikçi Francis Anscombe bu dört veri setini 1973\'te <i>American Statistician</i> dergisinde, o dönem yaygınlaşan bilgisayarlı istatistik yazılımlarının kullanıcılarını veriyi görselleştirmeye teşvik etmek için tasarladı.',
      formulas: [
        { tex: '\\bar{x} = 9.0,\\ \\bar{y} \\approx 7.50,\\ r \\approx 0.816 \\ \\text{(4 veri setinde de)}', desc: 'Dört Anscombe veri setinin ortak özet istatistikleri.' }
      ],
      tasks: [
        { step: 'Dört veri setini sırayla seçip, özet istatistik panelinin neredeyse değişmediğini ama grafiğin tamamen farklı olduğunu karşılaştırın.', preset: { sub: '5_2', set: 'II' } }
      ]
    },
    stats5_3: {
      title: 'Polinom Regresyon ve Aşırı Öğrenme (Overfitting)',
      intuitive: 'Polinom derecesini artırmak modele daha fazla "esneklik" verir — düşük derece gerçek eğilimi ıskalar (underfitting), çok yüksek derece ise eğitim verisindeki rastgele GÜRÜLTÜYÜ bile ezberler (overfitting). Ezberleyen model eğitim verisinde mükemmel görünür ama hiç görmediği yeni veride felaket performans gösterir — makine öğrenmesinin en temel ödünleşimi (bias-variance tradeoff) budur.',
      history: 'Bias-Variance ayrışımı modern istatistiksel öğrenme teorisinin (Hastie, Tibshirani, Friedman — <i>Elements of Statistical Learning</i>) temel taşlarından biridir; kavramsal kökleri ise 1970\'lerin model seçimi (Akaike, 1974) literatürüne dayanır.',
      formulas: [
        { tex: '\\hat{y} = \\beta_0 + \\beta_1 x + \\beta_2 x^2 + \\dots + \\beta_d x^d', desc: '$d$. dereceden polinom regresyon modeli.' },
        { tex: '\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^n (y_i - \\hat{y}_i)^2', desc: 'Ortalama Kare Hata — eğitim ve test (doğrulama) verisinde ayrı ayrı hesaplanır.' }
      ],
      tasks: [
        { step: 'Dereceyi $d=1$\'den $d=12$\'ye çıkarın — eğitim MSE\'sinin sürekli düşerken test/doğrulama MSE\'sinin belli bir noktadan sonra patladığını izleyin.', preset: { sub: '5_3', degree: 12 } }
      ]
    },
    stats6_1: {
      title: 'Monte Carlo Yöntemiyle π Sayısı Tahmini',
      intuitive: 'Birim kareye rastgele binlerce "dart" atın. Çeyrek daire içine düşenlerin oranı, dairenin alanının kareye oranına ($\\pi/4$) yakınsar — saf rastgelelikten kesin bir geometrik sabit elde edersiniz. Bu basit fikir, nükleer reaktör tasarımından finans mühendisliğine kadar her yerde kullanılan Monte Carlo yönteminin özüdür.',
      history: 'Stanislaw Ulam ve John von Neumann, 1940\'larda Los Alamos\'ta Manhattan Projesi sırasında nötron difüzyonu gibi analitik olarak çözülemeyen problemleri rastgele örnekleme ile çözmek için yöntemi geliştirdi; isim Ulam\'ın amcasının gittiği Monako\'daki Monte Carlo Kazinosu\'ndan gelir.',
      formulas: [
        { tex: '\\pi \\approx 4 \\cdot \\frac{N_{\\text{içeride}}}{N_{\\text{toplam}}}', desc: 'Birim karedeki rastgele $N$ noktadan, çeyrek birim daire içinde kalanların oranına dayalı $\\pi$ tahmini.' }
      ],
      tasks: [
        { step: 'Nokta sayısını 100\'den 100.000\'e çıkarın — tahminin gerçek $\\pi$\'ye (3.14159...) ne kadar yaklaştığını ve hata payının nasıl küçüldüğünü izleyin.', preset: { sub: '6_1', points: 100000 } }
      ]
    },
    stats6_2: {
      title: 'Markov Zincirleri ve Durağan Dağılım',
      intuitive: 'Bir sistemin BİR SONRAKİ durumu, sadece ŞU ANKİ duruma bağlıdır — geçmişin tamamı "hafızasızlık özelliği" (Markov özelliği) sayesinde önemsizdir. Geçiş olasılıklarını yeterince çok tekrarlarsanız, sistem başlangıç durumundan bağımsız olarak sabit bir "durağan dağılıma" yerleşir — Google\'ın PageRank algoritmasının da temelidir bu.',
      history: 'Andrei Markov, 1906\'da Puşkin\'in <i>Yevgeni Onegin</i> şiirindeki harf dizilerini analiz ederek zincirleri tanıttı — ironik olarak amacı, olayların bağımsız olması GEREKMEDİĞİNİ göstermekti, çağdaşı Pavel Nekrasov\'un aksi iddiasına karşı.',
      formulas: [
        { tex: '\\pi_j = \\sum_i \\pi_i P_{ij}, \\quad \\boldsymbol{\\pi} P = \\boldsymbol{\\pi}', desc: 'Durağan dağılım $\\boldsymbol{\\pi}$, geçiş matrisi $P$ ile çarpıldığında kendisini veren olasılık vektörüdür.' }
      ],
      tasks: [
        { step: 'Geçiş matrisindeki bir olasılığı aşırı uca çekin (örn. A\'dan B\'ye geçiş %95) — parçacıkların B düğümünde yoğunlaştığını ve yeni durağan dağılımı gözlemleyin.', preset: { sub: '6_2' } }
      ]
    },
    stats6_3: {
      title: '1B/2B Rastgele Yürüyüş (Random Walk) ve Brown Hareketi',
      intuitive: 'Her adımda rastgele yukarı ya da aşağı (ya da herhangi bir yöne) hareket eden bir parçacık, uzun vadede HİÇBİR yöne doğru sistematik eğilim göstermez, ama tipik uzaklığı zamanla $\\sqrt{t}$ oranında büyür — doğrusal değil! Bu, hisse senedi fiyatlarının, polen tanelerinin suda sürüklenmesinin (Brown hareketi) ve difüzyonun matematiksel iskeletidir.',
      history: 'Robert Brown 1827\'de polen tanelerinin su üzerindeki düzensiz hareketini gözlemledi; Albert Einstein 1905\'te bunun moleküler çarpışmalardan kaynaklandığını matematiksel olarak açıkladı (Brown Hareketi teorisi) — bu, atomların varlığının ilk dolaylı kanıtlarından biriydi.',
      formulas: [
        { tex: 'E[|W_t|] \\propto \\sqrt{t}, \\quad \\text{Var}(W_t) = t', desc: 'Wiener sürecinde (standart Brown hareketi), beklenen yer değiştirme zamanın kareköküyle, varyans ise doğrudan zamanla orantılıdır.' }
      ],
      tasks: [
        { step: '200 bağımsız yürüyüş yolunu aynı anda çalıştırıp, hepsinin zamanla $\\sqrt{t}$ zarfı (yarı-parabolik huni) içinde yayıldığını gözlemleyin.', preset: { sub: '6_3', walkers: 200 } }
      ]
    },
    stats7_1: {
      title: 'Temel Bileşenler Analizi (PCA)',
      intuitive: 'Verideki boyutları (sütunları) azaltmak istediğinizde, rastgele bir yön seçmek yerine verinin EN ÇOK yayıldığı (varyansın maksimum olduğu) yönü bulursunuz — bu ilk temel bileşendir (PC1). PC2, PC1\'e dik olan ve kalan en fazla varyansı açıklayan yöndür. 3B bir veri bulutunu döndürüp "en bilgilendirici" 2B gölgesini bulmaya benzer.',
      history: 'Karl Pearson 1901\'de PCA\'nın temelini attı ("en iyi uyan düzlemler ve doğrular" üzerine); Harold Hotelling 1933\'te yöntemi bugünkü özdeğer/özvektör formülasyonuyla modernize etti.',
      formulas: [
        { tex: '\\Sigma = \\frac{1}{n-1} X^T X \\ (\\text{merkezlenmiş } X)', desc: 'Kovaryans matrisi; PCA bu matrisin özvektörlerini (temel bileşen yönleri) ve özdeğerlerini (açıklanan varyans) bulur.' },
        { tex: '\\Sigma v_i = \\lambda_i v_i', desc: 'Özdeğer denklemi: $v_i$ temel bileşen yönü, $\\lambda_i$ o yöndeki açıklanan varyans miktarıdır.' }
      ],
      tasks: [
        { step: '3B nokta bulutunu döndürüp PC1 ekseninin verinin "en uzun" yönüne nasıl hizalandığını gözlemleyin.', preset: { sub: '7_1' } }
      ]
    },
    stats7_2: {
      title: 'K-Means Kümeleme (Clustering)',
      intuitive: 'K-Means, önce $K$ rastgele merkez (centroid) yerleştirir, her noktayı en yakın merkeze atar, sonra her merkezi kendisine atanan noktaların ağırlık merkezine taşır — bu iki adım (ata/güncelle) merkezler artık hareket etmeyene kadar tekrarlanır. Voronoi diyagramı, her an hangi bölgenin hangi merkeze "ait" olduğunu gösterir.',
      history: 'Yöntemin kökleri Hugo Steinhaus (1956) ve Stuart Lloyd\'un (1957, Bell Labs) çalışmalarına dayanır; "K-Means" terimini ise James MacQueen 1967\'de popülerleştirdi.',
      formulas: [
        { tex: '\\underset{S}{\\arg\\min} \\sum_{i=1}^K \\sum_{x \\in S_i} \\lVert x - \\mu_i \\rVert^2', desc: 'K-Means, küme-içi kare uzaklıkların toplamını (WCSS/inertia) minimize etmeye çalışır.' }
      ],
      tasks: [
        { step: '$K=3$ gerçek kümeden oluşan bir veri setinde yanlışlıkla $K=5$ seçin — algoritmanın bazı gerçek kümeleri gereksiz yere ikiye böldüğünü gözlemleyin.', preset: { sub: '7_2', k: 5 } }
      ]
    },
    stats8_1: {
      title: 'Olasılık: Madeni Para ve Zar',
      intuitive: 'Klasik olasılık, "olası tüm sonuçlar eşit şanslıysa" basitçe $P(A) = \\frac{\\text{istenen sonuç sayısı}}{\\text{toplam sonuç sayısı}}$ olarak tanımlanır. Tek bir para atışı %50-%50 iken, iki zarın toplamı ASLA eşit olasılıklı değildir — 7 gelme ihtimali (6 farklı kombinasyon: 1+6, 2+5...) 2 gelme ihtimalinden (sadece 1+1) 6 kat fazladır. Örneklem uzayını saymak, sezgiyi doğru olasılığa çevirir.',
      history: 'Olasılık teorisinin doğuşu, 1654\'te Chevalier de Méré\'nin bir zar oyunu sorusunu Blaise Pascal\'a sorması ve Pascal ile Pierre de Fermat arasındaki yazışmalara dayanır — bu mektuplaşma modern olasılık teorisinin resmi başlangıcı sayılır.',
      formulas: [
        { tex: 'P(A) = \\frac{n(A)}{n(S)}', desc: 'Klasik (Laplace) olasılık: istenen olay sayısının örneklem uzayı büyüklüğüne oranı.' },
        { tex: 'P(\\text{iki zar toplamı} = s) = \\frac{6 - |s - 7|}{36}', desc: 'İki adil zarın toplamının $s$ olma olasılığı — üçgen biçimli bir dağılım.' }
      ],
      tasks: [
        { step: 'Parayı 100 kez art arda atıp deneysel Yazı oranının teorik %50\'ye nasıl yaklaştığını izleyin.', preset: { sub: '8_1', probMode: 'coin' } },
        { step: 'Zarı 100 kez atıp 7 toplamının gerçekten diğer tüm toplamlardan daha sık çıktığını doğrulayın.', preset: { sub: '8_1', probMode: 'dice' } }
      ]
    },
    stats8_2: {
      title: 'Ortalamalar: Aritmetik, Geometrik ve Harmonik',
      intuitive: 'Üç ortalama da "veriyi tek bir sayıyla özetler" ama farklı sorulara cevap verir. Aritmetik Ortalama (AM) toplamları böler — günlük kullanımda en tanıdık olandır. Geometrik Ortalama (GM) çarpımsal büyüme oranları için doğrudur (örn. yıllık %8, %12, %-5 büyüyen bir yatırımın "gerçek" ortalama büyümesi). Harmonik Ortalama (HM) oranların (hız, verim) ortalamasını alırken doğrudur. Negatif olmayan sayılarda her zaman $AM \\ge GM \\ge HM$ eşitsizliği geçerlidir.',
      history: 'Pisagorcular M.Ö. 5. yüzyılda aritmetik, geometrik ve harmonik ortalamaları müzik teorisi ve geometriyle ilişkilendirerek tanımladı — "harmonik" adı, bu ortalamanın müzikal akorların frekans oranlarındaki rolünden gelir.',
      formulas: [
        { tex: 'AM = \\frac{1}{n}\\sum_{i=1}^n x_i', desc: 'Aritmetik Ortalama: değerlerin toplamının sayıya bölümü.' },
        { tex: 'GM = \\sqrt[n]{\\prod_{i=1}^n x_i}', desc: 'Geometrik Ortalama: değerlerin çarpımının n\'inci kökü — büyüme oranları için doğru ortalama.' },
        { tex: 'HM = \\frac{n}{\\sum_{i=1}^n \\frac{1}{x_i}}', desc: 'Harmonik Ortalama: terslerin aritmetik ortalamasının tersi — oran/hız ortalamaları için doğru.' }
      ],
      tasks: [
        { step: '"Yatırım Getirisi" senaryosunu seçin — AM\'nin gerçek bileşik büyümeyi neden ABARTTIĞINI, GM\'nin doğru cevabı verdiğini karşılaştırın.', preset: { sub: '8_2', avgScenario: 'investment' } },
        { step: '"Hız Ortalaması" senaryosunda AM yerine neden HM kullanılması gerektiğini veri noktalarının konumundan çıkarın.', preset: { sub: '8_2', avgScenario: 'speed' } }
      ]
    },
    stats8_3: {
      title: 'Normal Dağılım ve Çan Eğrisi',
      intuitive: 'İnsan boyu, IQ puanı, ölçüm hataları gibi doğadaki pek çok nicelik, çok sayıda küçük bağımsız etkinin toplamı olduğu için Normal dağılıma uyar (bkz. Merkezi Limit Teoremi). "68-95-99.7 kuralı": değerlerin yaklaşık %68\'i ortalamanın ±1 standart sapması içinde, %95\'i ±2σ içinde, %99.7\'si ±3σ içinde bulunur.',
      history: 'Normal dağılım ilk kez Abraham de Moivre tarafından 1733\'te binom dağılımının bir yaklaşımı olarak türetildi; Carl Friedrich Gauss 1809\'da gezegen yörüngesi ölçüm hatalarını modellerken bağımsız olarak yeniden keşfetti — bu yüzden "Gauss dağılımı" olarak da anılır.',
      formulas: [
        { tex: 'z = \\frac{x - \\mu}{\\sigma}', desc: 'Z-skoru: bir değerin ortalamadan kaç standart sapma uzakta olduğunu ölçer.' },
        { tex: 'P(\\mu - \\sigma \\le X \\le \\mu + \\sigma) \\approx 0.683', desc: '68-95-99.7 kuralının ilk basamağı.' }
      ],
      tasks: [
        { step: '"IQ Puanı" senaryosunu seçip 130 değerini girin — bu değerin yüzde kaçıncı persentilde olduğunu (ve "deha" eşiğine ne kadar yakın olduğunu) görün.', preset: { sub: '8_3', normScenario: 'iq' } }
      ]
    },
    stats8_4: {
      title: 'Korelasyon Sezgisi: Saçılma Grafiği Galerisi',
      intuitive: 'Korelasyon katsayısı $r$, $-1$ (mükemmel ters ilişki) ile $+1$ (mükemmel doğru ilişki) arasında değişir; $0$ ise doğrusal ilişki olmadığını gösterir. Bu galeri, farklı $r$ değerlerinin saçılma grafiğinde NASIL GÖRÜNDÜĞÜNE dair görsel bir sezgi kütüphanesi oluşturur — sayıyı görüp "bu ne kadar güçlü bir ilişki?" sorusuna hızla cevap verebilmeniz için. Noktaları sürükleyerek regresyon doğrusu kurmak ve ANOVA/R² tablosunu görmek isterseniz tam araç Modül 5\'tedir.',
      history: 'Korelasyon kavramı Francis Galton\'ın 1888 çalışmalarına dayanır; öğrencisi Karl Pearson 1896\'da bugün kullandığımız kesin matematiksel formülü (Pearson momentler çarpımı korelasyonu) yayımladı.',
      formulas: [
        { tex: '-1 \\le r \\le 1', desc: 'Pearson korelasyon katsayısının alabileceği değer aralığı.' }
      ],
      tasks: [
        { step: 'r=0 ve r=1.0 saçılma grafiklerini yan yana karşılaştırıp aradaki görsel farkı not edin, sonra "Modül 5\'e Git" ile kendi verinizle deneyin.', preset: { sub: '8_4', r: 0 } }
      ]
    }
  };

  window.StatsData = { ANSCOMBE, SCIENCE_WIKI };
})();
