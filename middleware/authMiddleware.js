import jwt from 'jsonwebtoken';

export const gozetci = (req, res, next) => {
    // Adamın gətirdiyi bileti (Tokeni) alırıq
    const token = req.header('Authorization');

    // Bilet yoxdursa, qapıdan qovuruq (401 - İcazəsiz)
    if (!token) {
        return res.status(401).json({ message: "İcazəsiz giriş. Lütfən daxil olun." });
    }
    try {
        // Tokeni öz gizli şifrəmizlə yoxlayırıq ki, saxta deyil ki?
        // ("Bearer " sözünü silmək üçün split istifadə edirik)

        const tokenKodu = token.split(" ")[1];
        const yoxlanmisMelumat = jwt.verify(tokenKodu, process.env.JWT_SECRET);

        // Bilet düzgündürsə, adamın məlumatlarını yadda saxlayıb qapını açırıq (next)

        req.user = yoxlanmisMelumat;
        next(); // Keçə bilərsən!


    } catch (error) {
        res.status(400).json({
            message: "Biletiniz (Token) saxtadir və ya vaxti kecib!"
        })
    }

}

// 2. Yalnız Adminləri içəri buraxan gözətçi
export const adminGozetci = (req, res, next) => {
    // Əgər istifadəçinin rolu 'admin'dirsə, qapını açırıq
    if (req.user && req.user.role === 'admin') {
        next(); //Keçə bilər
    } else {
        // əks halda Admin deyilsə 
        res.status(403).json({
            message: "Giriş qadağandır! Bu əməliyyatı yalnız Admin edə bilər."
        });
    }
}