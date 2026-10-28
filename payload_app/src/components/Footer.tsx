export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div>
            <h4>Bosco Center · Стипендії</h4>
            <p>Центр професійної освіти Боско.</p>
            <p>Система управління стипендіальними програмами для учнів центру.</p>
          </div>
          <div>
            <h4>Розділи</h4>
            <a href="/">Головна</a>
            <a href="/scholars">Стипендіати</a>
            <a href="/login">Увійти</a>
          </div>
          <div>
            <h4>Графік</h4>
            <p>Прийом заявок: 1 вересня – 24 грудня</p>
            <p>Оголошення стипендій: 31 січня</p>
          </div>
        </div>
        <div className="bottom">© {new Date().getFullYear()} Bosco Center. Усі права захищені.</div>
      </div>
    </footer>
  )
}
