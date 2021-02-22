public final class Test implements a, b {
    static int a = 23;
    Object d = null;
    static {
        a = -24;
    }
    public int f () {
        int a = 123;
        a += 1;
        return a;
    }
    native void f1();
    public static void main(String[] args) {
        Test t = new Test();
        int d = 1;
        Test t1 = new Test();
        Test t2 = new Test();
        Test t3 = new Test();
        Test t4 = new Test();
        Test t5 = new Test();
        Test t6 = new Test();
        if (t.f() > 0) {
        }
        switch (t.f()) {
            case 1:
                break;
        }
        switch (t.f()) {
          case 1:  // ...
          case 2:  // ...
          case 3:  // ...
          default: // ...
        }
        Encode encode = Base::encrypt;
        System.out.println(encode);
    }
}

interface b extends a, c {}
interface a {

}
interface c {

}

interface Encode {
    void encode(Derive person);
}
class Base {
    public void encrypt() {
        System.out.println("Base::speak");
    }
}
class Derive extends Base {
    @Override
    public void encrypt() {
        System.out.println("Derive::speak");
    }
}
